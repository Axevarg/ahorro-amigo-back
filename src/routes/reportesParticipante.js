import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = express.Router();

router.get("/reportes/participante/me", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔹 PARTICIPANTE EN CICLO ACTIVO
    const participanteRes = await pool.query(`
      SELECT p.id, c.anio, p.numeros, p.ahorro_semanal, p.ahorro_anual
      FROM participantes p
      JOIN ciclos c ON c.id = p.ciclo_id
      WHERE p.usuario_id = $1 AND c.estado='activo'
    `, [userId]);

    if (participanteRes.rows.length === 0) {
      return res.status(404).json({ message: "No participas en ciclo activo" });
    }

    const participante = participanteRes.rows[0];

    // 🔹 PAGOS
    const pagosRes = await pool.query(`
      SELECT s.numero, pa.monto, pa.fecha_pago, pa.tipo_pago
      FROM pagos_ahorro pa
      JOIN semanas s ON s.id = pa.semana_id
      WHERE pa.participante_id = $1
      ORDER BY s.numero
    `, [participante.id]);

    const pagos = pagosRes.rows;

    const totalAhorrado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

    // 🔹 PRÉSTAMO (si tiene)
    const prestamoRes = await pool.query(`
      SELECT id, monto_prestado, saldo_pendiente, fecha_inicio
      FROM prestamos
      WHERE participante_id = $1 AND estado='activo'
    `, [participante.id]);

    const prestamo = prestamoRes.rows[0];

    // 🔹 INTERESES DEL PRÉSTAMO
    let intereses = [];
    if (prestamo) {
      const interesesRes = await pool.query(`
        SELECT mes, anio, monto_interes
        FROM intereses_generados
        WHERE prestamo_id = $1
        ORDER BY anio, mes
      `, [prestamo.id]);

      intereses = interesesRes.rows;
    }

    // 🧾 GENERAR PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Disposition", "attachment; filename=estado_cuenta.pdf");
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // 🏦 TITULO
    doc.fontSize(20).text("Estado de Cuenta - Caja de Ahorro", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Ciclo ${participante.anio}`);
    doc.moveDown();

    // 💰 RESUMEN
    doc.fontSize(14).text("Resumen de ahorro");
    doc.fontSize(12).text(`Números adquiridos: ${participante.numeros}`);
    doc.text(`Ahorro anual esperado: $${participante.ahorro_anual}`);
    doc.text(`Total ahorrado: $${totalAhorrado}`);
    doc.moveDown();

    // 📅 TABLA DE PAGOS
    doc.fontSize(14).text("Pagos realizados");
    pagos.forEach(p => {
      doc.fontSize(11).text(
        `Semana ${p.numero} - $${p.monto} - ${p.tipo_pago} - ${new Date(p.fecha_pago).toLocaleDateString()}`
      );
    });

    // 🏦 SECCIÓN PRÉSTAMO
    if (prestamo) {
      doc.addPage();
      doc.fontSize(16).text("Información del préstamo");
      doc.text(`Monto prestado: $${prestamo.monto_prestado}`);
      doc.text(`Saldo pendiente: $${prestamo.saldo_pendiente}`);
      doc.moveDown();

      if (intereses.length > 0) {
        doc.fontSize(14).text("Intereses generados");
        intereses.forEach(i => {
          doc.fontSize(11).text(`Mes ${i.mes}/${i.anio} - $${i.monto_interes}`);
        });
      }
    }

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando PDF" });
  }
});

export default router;