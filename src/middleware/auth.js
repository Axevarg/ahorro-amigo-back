import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const token = header.split(" ")[1]; // Bearer TOKEN

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, rol, nombre }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}