import express from "express";
import pool from "../db.js";
import PDFDocument from "pdfkit";

const router = express.Router();

router.get("/ciclos/:id/reparto/pdf", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Obtener datos del ciclo
    const cicloRes = await pool.query(
      "SELECT anio FROM ciclos WHERE id=$1",
      [id]
    );

    if (cicloRes.rows.length === 0) {
      return res.status(404).json({ error: "Ciclo no encontrado" });
    }

    const anio = cicloRes.rows[0].anio;

    // 2️⃣ Obtener reparto
    const repartoRes = await pool.query(
      `SELECT 
        u.nombre,
        r.numeros,
        r.monto_interes
      FROM reparto_intereses r
      JOIN participantes p ON p.id = r.participante_id
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE r.ciclo_id = $1
      ORDER BY u.nombre`,
      [id]
    );

    const participantes = repartoRes.rows;

    if (participantes.length === 0) {
      return res.status(400).json({ error: "El ciclo aún no tiene reparto" });
    }

    // 3️⃣ Total repartido
    const totalRes = await pool.query(
      `SELECT COALESCE(SUM(monto_interes),0) AS total
       FROM reparto_intereses
       WHERE ciclo_id=$1`,
      [id]
    );

    const totalRepartido = Number(totalRes.rows[0].total);

    // 4️⃣ Crear PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reparto_ciclo_${anio}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // 🧾 TITULO
    doc.fontSize(20).text("Reparto de Intereses", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Ciclo ${anio}`, { align: "center" });
    doc.moveDown(2);

    // 🧾 Encabezados tabla
    doc.fontSize(12).text("Participante", 50);
    doc.text("Números", 300);
    doc.text("Ganancia", 380);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // 🧾 Filas
    participantes.forEach((p) => {
      doc.moveDown();
      doc.text(p.nombre, 50);
      doc.text(p.numeros.toString(), 300);
      doc.text(`$ ${Number(p.monto_interes).toFixed(2)}`, 380);
    });

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // 💰 TOTAL
    doc.moveDown();
    doc.fontSize(14).text(
      `TOTAL REPARTIDO: $ ${totalRepartido.toFixed(2)}`,
      { align: "right" }
    );

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

export default router;