import authenticationMiddleware from "@/middlewares/authentication.middleware";
import { Router, Request, Response } from "express";

const router = Router();

router.get(
  "/authentication/check",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      return res
        .status(200)
        .json({ success: true, accessGranted: res.locals.user.accessGranted });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
