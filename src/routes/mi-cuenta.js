import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/mi-cuenta/resumen", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        p.id AS participante_id,
        c.anio,
        p.numeros,
        p.ahorro_semanal,
        p.ahorro_anual,
        COALESCE(SUM(pa.monto),0) AS total_ahorrado
      FROM participantes p
      JOIN ciclos c ON c.id = p.ciclo_id
      LEFT JOIN pagos_ahorro pa ON pa.participante_id = p.id
      WHERE p.usuario_id = $1
      AND c.estado = 'activo'
      GROUP BY p.id, c.anio
    `, [userId]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo resumen" });
  }
});


router.get("/mi-cuenta/pagos", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const pagos = await pool.query(`
      SELECT 
        s.numero AS semana,
        pa.monto,
        pa.tipo_pago,
        pa.fecha_pago
      FROM pagos_ahorro pa
      JOIN participantes p ON p.id = pa.participante_id
      JOIN semanas s ON s.id = pa.semana_id
      WHERE p.usuario_id = $1
      ORDER BY s.numero
    `, [userId]);

    res.json(pagos.rows);

  } catch (err) {
    res.status(500).json({ message: "Error obteniendo pagos" });
  }
});

router.get("/mi-cuenta/prestamo", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const prestamo = await pool.query(`
      SELECT 
        pr.id,
        pr.monto_prestado,
        pr.saldo_pendiente,
        pr.pago_minimo_mensual,
        pr.fecha_inicio,
        COALESCE(SUM(ap.monto),0) AS total_abonado
      FROM prestamos pr
      JOIN participantes p ON p.id = pr.participante_id
      LEFT JOIN abonos_prestamo ap ON ap.prestamo_id = pr.id
      WHERE p.usuario_id = $1
      AND pr.estado = 'activo'
      GROUP BY pr.id
    `, [userId]);

    res.json(prestamo.rows[0] || null);

  } catch (err) {
    res.status(500).json({ message: "Error obteniendo préstamo" });
  }
});

router.get("/mi-cuenta/intereses", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const intereses = await pool.query(`
      SELECT 
        ig.mes,
        ig.anio,
        ig.monto_interes
      FROM intereses_generados ig
      JOIN prestamos pr ON pr.id = ig.prestamo_id
      JOIN participantes p ON p.id = pr.participante_id
      WHERE p.usuario_id = $1
      ORDER BY ig.anio, ig.mes
    `, [userId]);

    res.json(intereses.rows);

  } catch (err) {
    res.status(500).json({ message: "Error obteniendo intereses" });
  }
});


export default router;