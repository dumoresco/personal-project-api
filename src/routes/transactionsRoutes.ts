import { Router } from "express";
import { CardService } from "../services/CardService";
import { TransactionService } from "../services/TransactionService";

const router = Router();
const transactionController = new TransactionService();

router.post("/transactions/:userId", transactionController.createTransaction);
router.get("/transactions/:userId", transactionController.listTransactions);
router.delete(
  "/transactions/:userId",
  transactionController.deleteAllTransactions
);
router.delete(
  "/transactions/:userId/:transactionId",
  transactionController.deleteTransaction
);
export default router;
