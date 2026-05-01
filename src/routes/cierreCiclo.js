import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/ciclos/:id/cerrar", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Verificar que el ciclo exista y esté activo
    const ciclo = await client.query(
      "SELECT * FROM ciclos WHERE id=$1 AND estado='activo'",
      [id]
    );

    if (ciclo.rows.length === 0) {
      throw new Error("El ciclo no existe o ya está cerrado");
    }

    // 2️⃣ Obtener total de intereses generados por préstamos
    const intereses = await client.query(
      `SELECT COALESCE(SUM(i.monto_interes),0) AS total
       FROM intereses_generados i
       JOIN prestamos pr ON pr.id = i.prestamo_id
       JOIN participantes pa ON pa.id = pr.participante_id
       WHERE pa.ciclo_id = $1`,
      [id]
    );

    const totalIntereses = Number(intereses.rows[0].total);

    // 3️⃣ Obtener participantes elegibles para reparto
    const participantesRes = await client.query(
      `SELECT id, numeros
       FROM participantes
       WHERE ciclo_id=$1
       AND participa_reparto = true
       AND completo = true`,
      [id]
    );

    const participantes = participantesRes.rows;

    // 🔥 NUEVA LOGICA FLEXIBLE
    let resumenReparto = null;

    if (totalIntereses > 0 && participantes.length > 0) {
      const totalNumeros = participantes.reduce(
        (acc, p) => acc + p.numeros, 0
      );

      const gananciaPorNumero = totalIntereses / totalNumeros;

      for (const p of participantes) {
        const ganancia = gananciaPorNumero * p.numeros;

        await client.query(
          `INSERT INTO reparto_intereses
           (ciclo_id, participante_id, numeros, monto_interes)
           VALUES ($1,$2,$3,$4)`,
          [id, p.id, p.numeros, ganancia]
        );
      }

      resumenReparto = {
        totalIntereses,
        totalParticipantes: participantes.length,
        totalNumeros,
        gananciaPorNumero
      };
    }

    // 4️⃣ Cerrar ciclo 🔒 SIEMPRE
    await client.query(
      "UPDATE ciclos SET estado='cerrado' WHERE id=$1",
      [id]
    );

    await client.query("COMMIT");

    res.json({
      mensaje: "🎉 Ciclo cerrado correctamente",
      huboReparto: totalIntereses > 0 && participantes.length > 0,
      resumen: resumenReparto
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;