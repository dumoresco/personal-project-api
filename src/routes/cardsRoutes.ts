import { Router } from "express";
import { CardService } from "../services/CardService";

const router = Router();
const cardController = new CardService();
router.post("/cards/:userId", cardController.createCard);
router.get("/cards/:userId", cardController.listCards);
router.delete("/cards/:cardId/:userId", cardController.deleteCard);
router.patch(
  "/cards/:cardId/:userId",
  cardController.updateCardShowAtDashboard
);

export default router;
