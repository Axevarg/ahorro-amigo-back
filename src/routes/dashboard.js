import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    // 🔹 ciclo activo
    const cicloRes = await pool.query(
      `SELECT * FROM ciclos WHERE estado='activo' LIMIT 1`
    );

    const ciclo = cicloRes.rows[0];
    if (!ciclo) return res.json({ message: "No hay ciclo activo" });

    const ciclo_id = ciclo.id;

    // 💰 total recaudado del ciclo
    const recaudado = await pool.query(`
      SELECT COALESCE(SUM(monto),0) total
      FROM pagos_ahorro pa
      JOIN participantes p ON p.id = pa.participante_id
      WHERE p.ciclo_id = $1
    `,[ciclo_id]);

    // 👥 participantes activos
    const participantes = await pool.query(`
      SELECT COUNT(*) FROM participantes
      WHERE ciclo_id = $1
    `,[ciclo_id]);

    // 🏦 préstamos activos
    const prestamos = await pool.query(`
      SELECT COUNT(*) FROM prestamos
      WHERE ciclo_id = $1 AND estado='activo'
    `,[ciclo_id]);

    // 📅 semanas transcurridas
    const semanasTrans = await pool.query(`
      SELECT COUNT(*) FROM semanas
      WHERE ciclo_id = $1 AND fecha_fin <= CURRENT_DATE
    `,[ciclo_id]);

    // 💸 intereses generados
    const intereses = await pool.query(`
      SELECT COALESCE(SUM(monto_interes),0) total
      FROM intereses_generados ig
      JOIN prestamos pr ON pr.id = ig.prestamo_id
      WHERE pr.ciclo_id = $1
    `,[ciclo_id]);

    // 😈 MOROSOS DE LA SEMANA ACTUAL
    const semanaActual = await pool.query(`
      SELECT id, numero FROM semanas
      WHERE ciclo_id=$1
      AND fecha_inicio <= CURRENT_DATE
      AND fecha_fin >= CURRENT_DATE
      LIMIT 1
    `,[ciclo_id]);

    let morosos = [];

    if (semanaActual.rows.length > 0) {
      const semana_id = semanaActual.rows[0].id;

      const morososRes = await pool.query(`
        SELECT u.nombre, p.id participante_id
        FROM participantes p
        JOIN usuarios u ON u.id = p.usuario_id
        WHERE p.ciclo_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM pagos_ahorro pa
          WHERE pa.participante_id = p.id
          AND pa.semana_id = $2
        )
      `,[ciclo_id, semana_id]);

      morosos = morososRes.rows;
    }

    // 📈 GRÁFICA recaudo acumulado por semana
    const grafica = await pool.query(`
      SELECT s.numero,
      COALESCE(SUM(pa.monto),0) total
      FROM semanas s
      LEFT JOIN pagos_ahorro pa ON pa.semana_id = s.id
      WHERE s.ciclo_id = $1
      GROUP BY s.numero
      ORDER BY s.numero
    `,[ciclo_id]);

    res.json({
      ciclo,
      total_recaudado: recaudado.rows[0].total,
      participantes: participantes.rows[0].count,
      prestamos_activos: prestamos.rows[0].count,
      semanas_transcurridas: semanasTrans.rows[0].count,
      semanas_totales: ciclo.semanas_total,
      intereses_generados: intereses.rows[0].total,
      morosos_semana_actual: morosos,
      grafica_recaudacion: grafica.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error dashboard" });
  }
});

export default router;