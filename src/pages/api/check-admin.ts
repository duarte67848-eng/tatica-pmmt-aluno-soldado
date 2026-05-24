import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ configured: !!process.env.ADMIN_PASSWORD });
  }
  const { password } = req.body;
  // Senha fixa para teste: admin123
  const adminPassword = "admin123";
  res.status(200).json({ valid: password === adminPassword });
}
