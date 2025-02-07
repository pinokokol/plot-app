import jwt, { JwtPayload } from "jsonwebtoken";

const generateAccessToken = (userId: number): string => {
  return jwt.sign(
    { uid: userId },
    "693f721ec4cee4c9192370582c6044351e0f4d94fac4593dd21425803b8cc962",
    { expiresIn: "7d" }
  );
};

const decodeToken = (token: string): JwtPayload => {
  return jwt.decode(token) as JwtPayload;
};

const verifyToken = (token: string): string | JwtPayload | any => {
  try {
    const verification = jwt.verify(
      token,
      "693f721ec4cee4c9192370582c6044351e0f4d94fac4593dd21425803b8cc962"
    );
    return verification;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return "expired";
    }
    return "error";
  }
};

const generateResetToken = (userId: number): string => {
  return jwt.sign(
    { uid: userId },
    "693f721ec4cee4c9192370582c6044351e0f4d94fac4593dd21425803b8cc962",
    { expiresIn: "1h" }
  );
};

export default {
  generateAccessToken,
  verifyToken,
  decodeToken,
  generateResetToken,
};
