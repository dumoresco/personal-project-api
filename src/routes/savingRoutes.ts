import { Request, Response, Router } from "express";
import { UserService } from "../services/UserService";
import { SavingService } from "../services/SavingService";

const router = Router();
const userController = new SavingService();

router.get("/savings/:userId", (req: Request, res: Response) => {
  userController.listSavings(req, res);
});

router.post("/savings/:userId", (req: Request, res: Response) => {
  userController.createSaving(req, res);
});
export default router;
