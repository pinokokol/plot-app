import authenticationMiddleware from "@/middlewares/authentication.middleware";
import dataCollectionService from "@/services/data-collection.service";
import dataCollectionValidation from "@/validations/data-collection.validation";
import { Router, Request, Response } from "express";

const router = Router();

router.post("/data-collection", authenticationMiddleware, async (req: Request, res: Response) => {
  try {
    const validated = dataCollectionValidation.saveData.parse(req.body);
    await dataCollectionService.saveData(validated);

    return res.status(204);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
