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
exports.SavingService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("crypto");
require("dotenv").config();
class SavingService {
    listSavings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const savingsCollection = db.collection("savings");
                const savings = yield savingsCollection.find({ userId }).toArray();
                res.status(200).json({
                    message: "Savings encontrados",
                    savings,
                });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    createSaving(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { name, monthly_save, goal, total_saved } = req.body;
                if (!name || !monthly_save || !goal) {
                    return res.status(400).json({
                        message: "Nome, valor mensal e meta são obrigatórios",
                    });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const savingsCollection = db.collection("savings");
                const saving = {
                    id: (0, crypto_1.randomUUID)(),
                    name,
                    monthly_save,
                    total_saved,
                    goal,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                yield savingsCollection.insertOne(Object.assign(Object.assign({}, saving), { userId }));
                console.log("Saving cadastrado com sucesso", saving);
                res
                    .status(201)
                    .json({ message: "Saving cadastrado com sucesso", saving });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
}
exports.SavingService = SavingService;
