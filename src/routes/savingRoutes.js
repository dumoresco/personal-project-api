"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SavingService_1 = require("../services/SavingService");
const router = (0, express_1.Router)();
const userController = new SavingService_1.SavingService();
router.get("/savings/:userId", (req, res) => {
    userController.listSavings(req, res);
});
router.post("/savings/:userId", (req, res) => {
    userController.createSaving(req, res);
});
exports.default = router;
