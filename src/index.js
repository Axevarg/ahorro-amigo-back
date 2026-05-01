import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";
import ciclosRoutes from "./routes/ciclos.js";
import participantesRoutes from "./routes/participantes.js";
import pagosRoutes from "./routes/pagos.js";
import dashboardRoutes from "./routes/dashboard.js";
import prestamosRoutes from "./routes/prestamos.js";
import interesesRoutes from "./routes/intereses.js";
import cierreCicloRoutes from "./routes/cierreCiclo.js";
import repartoResumenRoutes from "./routes/repartoResumen.js";
import repartoPDFRoutes from "./routes/repartoPDF.js";
import miCuentaRoutes from "./routes/mi-cuenta.js";
import reportesParticipante from "./routes/reportesParticipante.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/ciclos", ciclosRoutes);
app.use("/api/participantes", participantesRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/intereses", interesesRoutes);
app.use("/api/cierre", cierreCicloRoutes);
app.use("/api/reparto", repartoResumenRoutes);
app.use("/api/reparto", repartoPDFRoutes);
app.use("/api/mi-cuenta", miCuentaRoutes);
app.use("/api/reportes", reportesParticipante);

app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API Caja de Ahorro funcionando 🚀" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});