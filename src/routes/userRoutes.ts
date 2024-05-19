import { Router } from "express";
import { UserService } from "../services/UserService";

const router = Router();
const userController = new UserService();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/login-otp", userController.loginOtp);

export default router;
