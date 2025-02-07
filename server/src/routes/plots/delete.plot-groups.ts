import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import { Router, Request, Response } from "express";

const router = Router();

router.delete(
  "/plots/plot-groups/:id",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await plotsService.deletePlotGroup(parseInt(id));

      return res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
