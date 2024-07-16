"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionService_1 = require("../services/TransactionService");
const router = (0, express_1.Router)();
const transactionController = new TransactionService_1.TransactionService();
router.post("/transactions/:userId", transactionController.createTransaction);
router.get("/transactions/:userId", transactionController.listTransactions);
router.delete("/transactions/:userId", transactionController.deleteAllTransactions);
router.delete("/transactions/:userId/:transactionId", transactionController.deleteTransaction);
router.get("/transactions/chart/:userId", transactionController.getMonthlyBalances);
router.post("/mock-transactions/:userId", transactionController.mockTransactions);
// getCurrentMonthBalance
router.get("/balance/:userId", (req, res) => transactionController.getCurrentMonthBalance(req, res));
// add event
router.post("/event/:userId", (req, res) => transactionController.createEvent(req, res));
// get events
router.get("/events/:userId", (req, res) => transactionController.listEventsByMonth(req, res));
exports.default = router;
