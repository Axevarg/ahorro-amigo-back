import pool from "../db.js";

export async function generarSemanas(ciclo) {
  const semanas = [];
  let fechaInicio = new Date(ciclo.fecha_inicio);

  for (let i = 1; i <= ciclo.semanas_total; i++) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaInicio);
    fin.setDate(fin.getDate() + 6);

    semanas.push({
      numero: i,
      fecha_inicio: inicio.toISOString().slice(0, 10),
      fecha_fin: fin.toISOString().slice(0, 10)
    });

    fechaInicio.setDate(fechaInicio.getDate() + 7);
  }

  // insertar todas en batch
  for (const semana of semanas) {
    await pool.query(`
      INSERT INTO semanas (ciclo_id, numero, fecha_inicio, fecha_fin)
      VALUES ($1,$2,$3,$4)
    `, [ciclo.id, semana.numero, semana.fecha_inicio, semana.fecha_fin]);
  }
}