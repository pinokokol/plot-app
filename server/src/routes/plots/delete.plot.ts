import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import plotValidation from "@/validations/plots.validation";
import { Router, Request, Response } from "express";

const router = Router();

router.delete(
  "/plots/:plotGroupId",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const plotGroupId = parseInt(req.params.plotGroupId);
      const { id } = plotValidation.deletePlot.parse(req.body);

      await plotsService.deletePlot(plotGroupId, id);

      return res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
