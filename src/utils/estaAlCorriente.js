import pool from "../db.js";

export async function estaAlCorriente(participante_id) {
  const semanasTrans = await pool.query(`
    SELECT COUNT(*) FROM semanas s
    JOIN participantes p ON p.ciclo_id = s.ciclo_id
    WHERE p.id = $1 AND s.fecha_fin <= CURRENT_DATE
  `,[participante_id]);

  const pagosDados = await pool.query(`
    SELECT COUNT(*) FROM pagos_ahorro pa
    JOIN semanas s ON s.id = pa.semana_id
    WHERE pa.participante_id = $1
    AND s.fecha_fin <= CURRENT_DATE
  `,[participante_id]);

  return Number(pagosDados.rows[0].count) >= Number(semanasTrans.rows[0].count);
}