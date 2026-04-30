import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { ciclo_id, usuario_id, numeros, participa_reparto } = req.body;

    // 1️⃣ Obtener datos del ciclo
    const ciclo = await pool.query(
      "SELECT monto_por_numero, semanas_total FROM ciclos WHERE id=$1",
      [ciclo_id]
    );

    if (ciclo.rows.length === 0)
      return res.status(404).json({ message: "Ciclo no existe" });

    const { monto_por_numero, semanas_total } = ciclo.rows[0];

    // 2️⃣ Calcular finanzas automáticas
    const ahorro_semanal = numeros * monto_por_numero;
    const ahorro_anual = ahorro_semanal * semanas_total;

    // 3️⃣ Insertar participante
    const result = await pool.query(
      `INSERT INTO participantes
      (ciclo_id, usuario_id, numeros, ahorro_semanal, ahorro_anual, participa_reparto)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [ciclo_id, usuario_id, numeros, ahorro_semanal, ahorro_anual, participa_reparto]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando participante" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        u.nombre,
        u.telefono,
        u.email
      FROM participantes p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Participante no encontrado" });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo participante" });
  }
});

router.get("/ciclo/:ciclo_id", async (req, res) => {
  try {
    const { ciclo_id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        u.nombre,
        u.telefono
      FROM participantes p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE ciclo_id = $1
      ORDER BY u.nombre`,
      [ciclo_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo participantes" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { numeros, participa_reparto, completo } = req.body;

    // Obtener participante
    const participante = await pool.query(
      "SELECT ciclo_id FROM participantes WHERE id=$1",
      [id]
    );

    const ciclo = await pool.query(
      "SELECT monto_por_numero, semanas_total FROM ciclos WHERE id=$1",
      [participante.rows[0].ciclo_id]
    );

    const { monto_por_numero, semanas_total } = ciclo.rows[0];

    const ahorro_semanal = numeros * monto_por_numero;
    const ahorro_anual = ahorro_semanal * semanas_total;

    const result = await pool.query(
      `UPDATE participantes SET
        numeros=$1,
        ahorro_semanal=$2,
        ahorro_anual=$3,
        participa_reparto=$4,
        completo=$5
      WHERE id=$6
      RETURNING *`,
      [numeros, ahorro_semanal, ahorro_anual, participa_reparto, completo, id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ message: "Error actualizando participante" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM participantes WHERE id=$1", [id]);
    res.json({ message: "Participante eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando participante" });
  }
});




export default router;