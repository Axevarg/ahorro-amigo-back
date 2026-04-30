import { Router } from "express";
import pool from "../db.js";
import { generarSemanas } from "../utils/generarSemanas.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      anio,
      fecha_inicio,
      fecha_fin,
      monto_por_numero,
      tasa_interes_mensual,
      semanas_total
    } = req.body;

    const result = await pool.query(
      `INSERT INTO ciclos 
      (anio, fecha_inicio, fecha_fin, monto_por_numero, tasa_interes_mensual, semanas_total)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [anio, fecha_inicio, fecha_fin, monto_por_numero, tasa_interes_mensual, semanas_total]
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
      "SELECT * FROM ciclos ORDER BY anio DESC"
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

router.get("/activo", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ciclos WHERE estado='activo' LIMIT 1"
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "No hay ciclo activo" });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo ciclo activo" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      anio,
      fecha_inicio,
      fecha_fin,
      monto_por_numero,
      tasa_interes_mensual,
      semanas_total,
      estado
    } = req.body;

    const result = await pool.query(
      `UPDATE ciclos SET
        anio = $1,
        fecha_inicio = $2,
        fecha_fin = $3,
        monto_por_numero = $4,
        tasa_interes_mensual = $5,
        semanas_total = $6,
        estado = $7
      WHERE id = $8
      RETURNING *`,
      [
        anio,
        fecha_inicio,
        fecha_fin,
        monto_por_numero,
        tasa_interes_mensual,
        semanas_total,
        estado,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando ciclo" });
  }
});

router.put("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ obtener ciclo
    const cicloRes = await pool.query(
      "SELECT * FROM ciclos WHERE id=$1",
      [id]
    );

    const ciclo = cicloRes.rows[0];
    if (!ciclo) return res.status(404).json({ message: "Ciclo no existe" });

    if (ciclo.estado !== "configuracion")
      return res.status(400).json({ message: "El ciclo ya está activo o cerrado" });

    // 2️⃣ activar ciclo
    await pool.query(
      "UPDATE ciclos SET estado='activo' WHERE id=$1",
      [id]
    );

    // 3️⃣ generar semanas automáticamente
    await generarSemanas(ciclo);

    res.json({ message: "Ciclo activado y semanas generadas 🚀" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error activando ciclo" });
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