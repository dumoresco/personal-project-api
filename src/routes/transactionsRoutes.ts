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

router.get(
  "/transactions/chart/:userId",
  transactionController.getMonthlyBalances
);

// update transaction
router.put(
  "/transactions/:userId/:transactionId",
  transactionController.updateTransaction
);

router.post(
  "/mock-transactions/:userId",
  transactionController.mockTransactions
);

// getCurrentMonthBalance
router.get("/balance/:userId", (req, res) =>
  transactionController.getCurrentMonthBalance(req, res)
);

// add event
router.post("/event/:userId", (req, res) =>
  transactionController.createEvent(req, res)
);

// get events
router.get("/events/:userId", (req, res) =>
  transactionController.listEventsByMonth(req, res)
);
export default router;
