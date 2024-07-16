"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("crypto");
require("dotenv").config();
class BetService {
    createBet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { value, odd } = req.body;
                const { userId } = req.params;
                if (!value || !odd) {
                    return res.status(400).json({ message: "Missing required fields" });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                const newBet = {
                    id: (0, crypto_1.randomUUID)(),
                    userId,
                    value,
                    odd,
                    status: "pending",
                    resultado: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const betsCollection = db.collection("bets");
                // pega a banca e diminui o valor da aposta
                const newBanca = user.banca - value;
                if (newBanca < 0) {
                    return res.status(400).json({ message: "Insufficient funds" });
                }
                yield usersCollection.updateOne({ id: userId }, { $set: { banca: newBanca, updatedAt: new Date().toISOString() } });
                yield betsCollection.insertOne(newBet);
                return res.status(201).json(newBet);
            }
            catch (error) {
                console.error("Error creating bet:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    updateBetStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { betId } = req.params;
                const { status } = req.body;
                if (!status || !["win", "loss"].includes(status)) {
                    return res.status(400).json({ message: "Invalid status" });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const betsCollection = db.collection("bets");
                const usersCollection = db.collection("users");
                const bet = yield betsCollection.findOne({ id: betId });
                if (!bet) {
                    return res.status(404).json({ message: "Bet not found" });
                }
                let resultado = 0;
                const user = yield usersCollection.findOne({ id: bet.userId });
                if (status === "win") {
                    resultado = bet.value * bet.odd;
                }
                else if (status === "loss") {
                }
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                const newBanca = user.banca + resultado;
                yield usersCollection.updateOne({ id: bet.userId }, { $set: { banca: newBanca, updatedAt: new Date().toISOString() } });
                const result = yield betsCollection.updateOne({ id: betId }, {
                    $set: {
                        status,
                        resultado,
                        updatedAt: new Date().toISOString(),
                    },
                });
                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "Bet not found" });
                }
                return res
                    .status(200)
                    .json({ message: "Bet status updated successfully" });
            }
            catch (error) {
                console.error("Error updating bet status:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    listBets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const betsCollection = db.collection("bets");
                const usersCollection = db.collection("users");
                const bets = yield betsCollection.find({ userId }).toArray();
                const user = yield usersCollection.findOne({ id: userId });
                // se user.banca não existir, cria com valor de 1240
                if (!(user === null || user === void 0 ? void 0 : user.banca)) {
                    yield usersCollection.updateOne({ id: userId }, { $set: { banca: 1240, updatedAt: new Date().toISOString() } });
                }
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                return res.status(200).json({ bets, banca: user.banca });
            }
            catch (error) {
                console.error("Error listing bets:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    deleteAllBets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const betsCollection = db.collection("bets");
                const usersCollection = db.collection("users");
                const result = yield betsCollection.deleteMany({});
                yield usersCollection.updateMany({}, { $set: { banca: 1240 } });
                return res.status(200).json({
                    message: "All bets deleted successfully and all balances reset",
                    deletedCount: result.deletedCount,
                });
            }
            catch (error) {
                console.error("Error deleting all bets:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.BetService = BetService;
