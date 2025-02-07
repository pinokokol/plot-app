import authenticationMiddleware from "@/middlewares/authentication.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get(
  "/user/profile",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      return res.status(200).json({ success: true, user: res.locals.user });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
