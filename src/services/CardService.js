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
exports.CardService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("crypto");
const mongodb_1 = require("mongodb");
require("dotenv").config();
class CardService {
    // createCard
    createCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { number, cvv, bank, type, validity } = req.body;
                if (!number || !cvv || !bank || !type || !validity) {
                    return res.status(400).json({
                        message: "Número do cartão, CVV, banco, tipo e validade são obrigatórios",
                    });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const card = {
                    id: (0, crypto_1.randomUUID)(),
                    number,
                    cvv,
                    bank,
                    type,
                    validity,
                    value: 0,
                    show_at_dashboard: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const cardsCollection = db.collection("cards");
                const existingCard = yield cardsCollection.findOne({
                    number,
                    userId,
                });
                if (existingCard) {
                    return res.status(400).json({ message: "Cartão já cadastrado" });
                }
                const cards = yield cardsCollection.find({ userId }).toArray();
                if (cards.length >= 10) {
                    return res.status(400).json({ message: "Limite de cartões atingido" });
                }
                yield cardsCollection.insertOne(Object.assign(Object.assign({}, card), { userId }));
                res.status(201).json({ message: "Cartão criado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    listCards(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const cardsCollection = db.collection("cards");
                const cards = yield cardsCollection.find({ userId }).toArray();
                cards.forEach((card) => {
                    if (!card.value) {
                        card.value = 0;
                    }
                });
                res.status(200).json(cards);
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    deleteCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, cardId } = req.params;
                const cardObjectId = new mongodb_1.ObjectId(cardId);
                const db = yield (0, db_1.connectToDatabase)();
                const cardsCollection = db.collection("cards");
                const card = yield cardsCollection.findOne({ _id: cardObjectId, userId });
                if (!card) {
                    return res.status(400).json({ message: "Cartão não encontrado" });
                }
                yield cardsCollection.deleteOne({ _id: cardObjectId });
                res.status(200).json({ message: "Cartão deletado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    updateCardShowAtDashboard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, cardId } = req.params;
                const { show_at_dashboard } = req.body;
                const cardObjectId = new mongodb_1.ObjectId(cardId);
                const db = yield (0, db_1.connectToDatabase)();
                const cardsCollection = db.collection("cards");
                const card = yield cardsCollection.findOne({
                    _id: cardObjectId,
                    userId,
                });
                if (!card) {
                    return res.status(400).json({ message: "Cartão não encontrado" });
                }
                yield cardsCollection.updateOne({ _id: cardObjectId }, {
                    $set: {
                        show_at_dashboard,
                        updatedAt: new Date().toISOString(),
                    },
                });
                res.status(200).json({ message: "Cartão atualizado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
}
exports.CardService = CardService;
