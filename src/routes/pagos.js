import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      participante_id,
      semana_id,
      monto,
      tipo_pago,
      referencia
    } = req.body;

    const result = await pool.query(`
      INSERT INTO pagos_ahorro
      (participante_id, semana_id, monto, tipo_pago, referencia)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [participante_id, semana_id, monto, tipo_pago, referencia]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);

    if (err.code === "23505")
      return res.status(400).json({ message: "Ese pago ya está registrado" });

    res.status(500).json({ message: "Error registrando pago" });
  }
});


router.get("/participante/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT
      pa.*,
      s.numero AS semana_numero,
      s.fecha_inicio,
      s.fecha_fin
    FROM pagos_ahorro pa
    JOIN semanas s ON s.id = pa.semana_id
    WHERE pa.participante_id = $1
    ORDER BY s.numero
  `, [id]);

  res.json(result.rows);
});


router.get("/estado/:participante_id", async (req, res) => {
  try {
    const { participante_id } = req.params;

    // participante + ciclo
    const participante = await pool.query(`
      SELECT p.*, c.semanas_total
      FROM participantes p
      JOIN ciclos c ON c.id = p.ciclo_id
      WHERE p.id = $1
    `,[participante_id]);

    const p = participante.rows[0];

    // total pagado
    const pagos = await pool.query(`
      SELECT COALESCE(SUM(monto),0) total
      FROM pagos_ahorro
      WHERE participante_id = $1
    `,[participante_id]);

    const total_pagado = Number(pagos.rows[0].total);
    const deuda_total = Number(p.ahorro_anual) - total_pagado;

    // semanas transcurridas del ciclo
    const semanasTrans = await pool.query(`
      SELECT COUNT(*) FROM semanas
      WHERE ciclo_id = $1 AND fecha_fin <= CURRENT_DATE
    `,[p.ciclo_id]);

    // semanas pagadas
    const semanasPagadas = await pool.query(`
      SELECT COUNT(*) FROM pagos_ahorro pa
      JOIN semanas s ON s.id = pa.semana_id
      WHERE pa.participante_id = $1
      AND s.fecha_fin <= CURRENT_DATE
    `,[participante_id]);

    const al_corriente =
      Number(semanasPagadas.rows[0].count) >=
      Number(semanasTrans.rows[0].count);

    res.json({
      ahorro_semanal: p.ahorro_semanal,
      ahorro_anual: p.ahorro_anual,
      total_pagado,
      deuda_total,
      semanas_pagadas: semanasPagadas.rows[0].count,
      semanas_transcurridas: semanasTrans.rows[0].count,
      al_corriente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error calculando estado" });
  }
});


export default router;