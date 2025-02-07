import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import plotValidation from "@/validations/plots.validation";
import { Router, Request, Response } from "express";

const router = Router();

router.post(
  "/sync",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const { plotGroups, plots } = plotValidation.sync.parse(req.body);
      const plotGroupIds = await plotsService.sync(user, plotGroups, plots);

      return res.status(200).json({ success: true, plotGroupIds });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
