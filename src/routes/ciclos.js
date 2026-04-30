import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      monto_semanal,
      total_semanas,
      fecha_inicio,
      fecha_fin
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ciclos 
      (nombre, monto_semanal, total_semanas, fecha_inicio, fecha_fin)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [nombre, monto_semanal, total_semanas, fecha_inicio, fecha_fin]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando ciclo" });
  }
});


router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ciclos ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo ciclos" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM ciclos WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Ciclo no encontrado" });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo ciclo" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      monto_semanal,
      total_semanas,
      fecha_inicio,
      fecha_fin,
      estado
    } = req.body;

    const result = await pool.query(
      `UPDATE ciclos SET
        nombre = $1,
        monto_semanal = $2,
        total_semanas = $3,
        fecha_inicio = $4,
        fecha_fin = $5,
        estado = $6
      WHERE id = $7
      RETURNING *`,
      [nombre, monto_semanal, total_semanas, fecha_inicio, fecha_fin, estado, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando ciclo" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM ciclos WHERE id = $1", [id]);

    res.json({ message: "Ciclo eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando ciclo" });
  }
});

export default router;