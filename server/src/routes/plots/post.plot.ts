import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import plotValidation from "@/validations/plots.validation";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/plots/:plotGroupId", authenticationMiddleware, async (req: Request, res: Response) => {
  try {
    const plotGroupId = parseInt(req.params.plotGroupId);

    const addPlotBody = plotValidation.addPlot.parse(req.body);
    const data = await plotsService.addPlot(addPlotBody, plotGroupId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
