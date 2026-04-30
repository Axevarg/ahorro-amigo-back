import { Router } from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";

const router = Router();

// crear usuario
router.post("/", async (req, res) => {
  try {
    const { nombre, telefono, email, password, rol } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, telefono, email, password_hash, rol)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, nombre, telefono, email, rol`,
      [nombre, telefono, email, hash, rol]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creando usuario" });
  }
});

// obtener usuario
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, telefono, email, rol 
       FROM usuarios WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "No encontrado" });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo usuario" });
  }
});

export default router;