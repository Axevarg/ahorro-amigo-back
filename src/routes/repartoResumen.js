import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/ciclos/:id/reparto", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        u.nombre,
        u.apellido,
        r.numeros,
        r.monto_interes
      FROM reparto_intereses r
      JOIN participantes p ON p.id = r.participante_id
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE r.ciclo_id = $1
      ORDER BY u.nombre ASC
      `,
      [id]
    );

    // Total repartido
    const totalRes = await pool.query(
      `
      SELECT COALESCE(SUM(monto_interes),0) AS total
      FROM reparto_intereses
      WHERE ciclo_id = $1
      `,
      [id]
    );

    res.json({
      ciclo_id: id,
      total_repartido: Number(totalRes.rows[0].total),
      participantes: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo resumen de reparto" });
  }
});

export default router;