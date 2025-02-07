import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import plotValidation from "@/validations/plots.validation";
import { Router, Request, Response } from "express";

const router = Router();

router.post(
  "/plots/plot-groups",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const { name } = plotValidation.addPlotGroup.parse(req.body);
      const data = await plotsService.addPlotGroup(user, name);

      return res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
