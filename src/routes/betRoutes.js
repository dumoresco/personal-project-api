"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BetService_1 = require("../services/BetService");
const router = (0, express_1.Router)();
const betController = new BetService_1.BetService();
// create bet
// Rota para criar uma nova aposta
router.post("/bets/:userId", (req, res) => betController.createBet(req, res));
// Rota para deletar todas as apostas
router.delete("/bets", (req, res) => betController.deleteAllBets(req, res));
// Rota para atualizar o status de uma aposta específica
router.put("/bets/:betId/status", (req, res) => betController.updateBetStatus(req, res));
// Rota para listar todas as apostas de um usuário específico
router.get("/bets/:userId", (req, res) => betController.listBets(req, res));
// Rota para listar todas as apostas
router.get("/bets", (req, res) => betController.listBets(req, res));
exports.default = router;
