import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ configured: !!process.env.ADMIN_PASSWORD });
  }
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin@Tatica2024!";
  res.status(200).json({ valid: password === adminPassword });
}
