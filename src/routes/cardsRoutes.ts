import { Router } from "express";
import { CardService } from "../services/CardService";

const router = Router();
const cardController = new CardService();
router.post("/cards/:userId", cardController.createCard);
router.get("/cards/:userId", cardController.listCards);

export default router;
