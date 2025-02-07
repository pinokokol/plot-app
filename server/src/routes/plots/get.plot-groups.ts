import authenticationMiddleware from "@/middlewares/authentication.middleware";
import plotsService from "@/services/plots.service";
import { Router, Request, Response } from "express";

const router = Router();

router.get(
  "/plots/plot-groups",
  authenticationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = res.locals.user;
      const {
        limit,
        offset = 0,
        sort = "name",
        order = "asc",
        query = "",
      } = req.query;

      const data = await plotsService.getPlotGroups(user, {
        limit: limit ? Number(limit) : undefined,
        offset: Number(offset),
        sort: String(sort),
        order: String(order),
        query: String(query),
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
