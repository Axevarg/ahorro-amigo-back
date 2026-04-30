import express from "express";
import auth from "../middleware/auth.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

router.get("/privado", auth, (req, res) => {
  res.json({
    message: "Ruta protegida OK",
    user: req.user,
  });
});

router.get("/solo-admin", auth, adminOnly, (req, res) => {
  res.json({
    message: "Eres ADMIN 😎",
  });
});

export default router;