import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { password } = req.body;
  // Senha do admin definida aqui
  const adminPassword = "Pmmt2026!@#";
  res.status(200).json({ valid: password === adminPassword });
}
