import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";
import ciclosRoutes from "./routes/ciclos.js";
import participantesRoutes from "./routes/participantes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/ciclos", ciclosRoutes);
app.use("/api/participantes", participantesRoutes);


app.get("/", (req, res) => {
  res.json({ ok: true, msg: "API Caja de Ahorro funcionando 🚀" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});