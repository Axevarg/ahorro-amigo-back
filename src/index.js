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


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/ciclos", ciclosRoutes);
app.use("/api/participantes", participantesRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/intereses", interesesRoutes);
app.use("/api", cierreCicloRoutes);


app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API Caja de Ahorro funcionando 🚀" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});