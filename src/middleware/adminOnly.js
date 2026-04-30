export default function adminOnly(req, res, next) {
  if (req.user.rol !== "admin") {
    return res.status(403).json({ message: "Solo administradores" });
  }
  next();
}