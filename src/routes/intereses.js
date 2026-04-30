import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/generar", async (req, res) => {
  try {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    // 🔎 obtener ciclo activo (para tasa interés)
    const cicloRes = await pool.query(
      `SELECT * FROM ciclos WHERE estado='activo' LIMIT 1`
    );

    const ciclo = cicloRes.rows[0];
    if (!ciclo)
      return res.status(400).json({ message: "No hay ciclo activo" });

    const tasa = Number(ciclo.tasa_interes_mensual);

    // 🔎 préstamos activos
    const prestamos = await pool.query(`
      SELECT * FROM prestamos
      WHERE estado='activo'
    `);

    let interesesGenerados = [];

    for (const prestamo of prestamos.rows) {

      // ❌ evitar duplicar interés del mismo mes
      const yaExiste = await pool.query(`
        SELECT 1 FROM intereses_generados
        WHERE prestamo_id=$1 AND mes=$2 AND anio=$3
      `,[prestamo.id, mes, anio]);

      if (yaExiste.rows.length > 0) continue;

      // 💰 cuánto abonó este mes
      const abonosMes = await pool.query(`
        SELECT COALESCE(SUM(monto),0) total
        FROM abonos_prestamo
        WHERE prestamo_id=$1
        AND EXTRACT(MONTH FROM fecha_abono)=$2
        AND EXTRACT(YEAR FROM fecha_abono)=$3
      `,[prestamo.id, mes, anio]);

      const abonado = Number(abonosMes.rows[0].total);

      // ✔ si pagó mínimo → no genera interés
      if (abonado >= Number(prestamo.pago_minimo_mensual)) continue;

      // 💸 calcular interés
      const saldoBase = Number(prestamo.saldo_pendiente);
      const montoInteres = saldoBase * (tasa / 100);

      // guardar cargo
      await pool.query(`
        INSERT INTO intereses_generados
        (prestamo_id, mes, anio, saldo_base, tasa_aplicada, monto_interes)
        VALUES ($1,$2,$3,$4,$5,$6)
      `,[prestamo.id, mes, anio, saldoBase, tasa, montoInteres]);

      // aumentar saldo del préstamo
      await pool.query(`
        UPDATE prestamos
        SET saldo_pendiente = saldo_pendiente + $1
        WHERE id=$2
      `,[montoInteres, prestamo.id]);

      interesesGenerados.push({
        prestamo_id: prestamo.id,
        interes: montoInteres
      });
    }

    res.json({
      message: "Intereses generados correctamente 📈",
      total_prestamos_con_interes: interesesGenerados.length,
      detalles: interesesGenerados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando intereses" });
  }
});

export default router;