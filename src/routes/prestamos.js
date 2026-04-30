import { Router } from "express";
import pool from "../db.js";
import { estaAlCorriente } from "../utils/estaAlCorriente.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { participante_id, monto } = req.body;

    // 🔎 obtener participante + ciclo
    const partRes = await pool.query(`
      SELECT p.*, c.id ciclo_id
      FROM participantes p
      JOIN ciclos c ON c.id = p.ciclo_id
      WHERE p.id=$1
    `,[participante_id]);

    const p = partRes.rows[0];
    if (!p) return res.status(404).json({ message:"Participante no existe" });

    // ❌ validar al corriente
    const alCorriente = await estaAlCorriente(participante_id);
    if (!alCorriente)
      return res.status(400).json({ message:"El participante NO está al corriente" });

    // ❌ validar monto máximo
    if (Number(monto) > Number(p.ahorro_anual))
      return res.status(400).json({ message:"Monto excede ahorro anual permitido" });

    // 💰 sugerir pago mínimo mensual (12 meses)
    const pago_minimo = monto / 12;

    const result = await pool.query(`
      INSERT INTO prestamos
      (participante_id, ciclo_id, monto_prestado, saldo_pendiente, pago_minimo_mensual)
      VALUES ($1,$2,$3,$3,$4)
      RETURNING *
    `,[participante_id, p.ciclo_id, monto, pago_minimo]);

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message:"Error creando préstamo" });
  }
});

router.get("/", async (req,res)=>{
  const result = await pool.query(`
    SELECT pr.*, u.nombre
    FROM prestamos pr
    JOIN participantes p ON p.id = pr.participante_id
    JOIN usuarios u ON u.id = p.usuario_id
    ORDER BY pr.created_at DESC
  `);

  res.json(result.rows);
});

router.post("/:id/abonos", async (req,res)=>{
  try {
    const { id } = req.params;
    const { monto, tipo_pago, referencia } = req.body;

    // guardar abono
    await pool.query(`
      INSERT INTO abonos_prestamo
      (prestamo_id, monto, tipo_pago, referencia)
      VALUES ($1,$2,$3,$4)
    `,[id, monto, tipo_pago, referencia]);

    // actualizar saldo
    await pool.query(`
      UPDATE prestamos
      SET saldo_pendiente = saldo_pendiente - $1
      WHERE id = $2
    `,[monto, id]);

    // liquidar si saldo <= 0
    await pool.query(`
      UPDATE prestamos
      SET estado='liquidado'
      WHERE id=$1 AND saldo_pendiente <= 0
    `,[id]);

    res.json({ message:"Abono registrado 💸" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message:"Error registrando abono" });
  }
});

router.get("/:id", async (req,res)=>{
  const { id } = req.params;

  const prestamo = await pool.query(`
    SELECT * FROM prestamos WHERE id=$1
  `,[id]);

  const abonos = await pool.query(`
    SELECT * FROM abonos_prestamo
    WHERE prestamo_id=$1
    ORDER BY fecha_abono DESC
  `,[id]);

  res.json({
    prestamo: prestamo.rows[0],
    abonos: abonos.rows
  });
});

export default router;