import authenticationService from "@/services/authentication.service";
import jwtUtil from "@/utils/jwt.util";
import { Request, Response, NextFunction } from "express";

const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.["access_token"] || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    let verifiedToken = jwtUtil.verifyToken(token);

    if (typeof verifiedToken === "string") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await authenticationService.getUserMiddleware(verifiedToken);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    res.locals.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export default authenticationMiddleware;
