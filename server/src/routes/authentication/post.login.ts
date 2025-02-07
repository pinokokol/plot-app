import { Router, Request, Response } from "express";
import authenticationValidation from "@/validations/authentication.validation";
import authenticationService from "@/services/authentication.service";

const router = Router();

router.post("/authentication/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = authenticationValidation.login.parse(req.body);

    const accessToken = await authenticationService.login(email, password);

    if (!accessToken) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    return res
      .status(200)
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 604800000,
      })
      .json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
