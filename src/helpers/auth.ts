import jwt from "jsonwebtoken";

export function generateAuthToken(userId: string) {
  const jwtSecret = process.env.JWT_SECRET;
  return jwt.sign({ id: userId }, jwtSecret as string, { expiresIn: "1d" });
}
