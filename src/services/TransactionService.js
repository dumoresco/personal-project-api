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
exports.TransactionService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("crypto");
const mongodb_1 = require("mongodb");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const zod_1 = require("zod");
require("dotenv").config();
class TransactionService {
    constructor() {
        this.addNewEventSchema = zod_1.z.object({
            title: zod_1.z.string().min(1, { message: "O título é obrigatório" }),
            start: zod_1.z.string().min(1, { message: "A data de início é obrigatória" }),
            end: zod_1.z.string().min(1, { message: "A data de término é obrigatória" }),
            repeat: zod_1.z.enum(["daily", "weekly", "monthly", "yearly"], {
                message: "Repetição inválida",
            }),
            color: zod_1.z.enum(["purple", "blue", "green", "yellow", "red"], {
                message: "Cor inválida",
            }),
        });
        // Função para formatar uma data para o formato ISO 8601 (yyyy-MM-ddTHH:mm:ss.SSSZ)
    }
    createTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { cardId, name, value, description, type, date } = req.body;
                if (!cardId || !value) {
                    return res.status(400).json({
                        message: "Cartão, valor são obrigatórios",
                    });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const cardsCollection = db.collection("cards");
                const card = yield cardsCollection.findOne({
                    _id: new mongodb_1.ObjectId(cardId),
                    userId,
                });
                if (!card) {
                    return res.status(400).json({ message: "Cartão não encontrado" });
                }
                // if (card.value < value) {
                //   return res.status(400).json({ message: "Saldo insuficiente" });
                // }
                const transactionsCollection = db.collection("transactions");
                const transaction = {
                    id: (0, crypto_1.randomUUID)(),
                    card,
                    value,
                    name,
                    type,
                    date,
                    description,
                    createdAt: new Date().toISOString(),
                };
                yield transactionsCollection.insertOne(transaction);
                if (type === "expense") {
                    card.value -= value;
                }
                if (type === "income") {
                    card.value += value;
                }
                yield cardsCollection.updateOne({ _id: new mongodb_1.ObjectId(cardId) }, {
                    $set: {
                        value: card.value,
                        updatedAt: new Date().toISOString(),
                    },
                });
                res.status(201).json({ message: "Transação realizada com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    listTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const db = yield (0, db_1.connectToDatabase)();
                const transactionsCollection = db.collection("transactions");
                const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
                const size = parseInt(req.query.size) || 10; // Tamanho da página (padrão: 10)
                const search = req.query.search || "";
                const skip = (page - 1) * size;
                let query = {};
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                    ];
                }
                // Contar o total de documentos com base na query filtrada
                const total = yield transactionsCollection.countDocuments(query);
                // Calcular quantos registros pular (skip) e quantos limitar (limit)
                const transactions = yield transactionsCollection
                    .find(query)
                    .skip(skip) // Pular registros conforme a página
                    .limit(size) // Limitar o número de registros por página
                    .toArray();
                // Calcular o total de páginas com base no total filtrado
                const totalPages = Math.ceil(total / size);
                // Retornar as transações e informações de paginação
                res.status(200).json({
                    transactions,
                    totalPages,
                    currentPage: page,
                    pageSize: size,
                    total,
                });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    // deleteAllTransactions
    // ao deletar todas as transaçoes de um usuario, o saldo de todos os cartões cadastrados por ele deve ser zerado
    deleteAllTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { search } = req.query;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const cardsCollection = db.collection("cards");
                const cards = yield cardsCollection.find({ userId }).toArray();
                for (const card of cards) {
                    yield cardsCollection.updateOne({ _id: new mongodb_1.ObjectId(card._id) }, {
                        $set: {
                            value: 0,
                            updatedAt: new Date().toISOString(),
                        },
                    });
                }
                const transactionsCollection = db.collection("transactions");
                yield transactionsCollection.deleteMany({ "card.userId": userId });
                res.status(200).json({ message: "Transações deletadas com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    // deletar uma transação
    // ao deletar uma transação, o saldo do cartão deve ser atualizado de acordo com o valor da transação e o tipo dela
    deleteTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, transactionId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const transactionsCollection = db.collection("transactions");
                const transaction = yield transactionsCollection.findOne({
                    id: transactionId,
                    "card.userId": userId,
                });
                if (!transaction) {
                    return res.status(400).json({ message: "Transação não encontrada" });
                }
                const cardsCollection = db.collection("cards");
                const card = yield cardsCollection.findOne({
                    _id: new mongodb_1.ObjectId(transaction.card._id),
                    userId,
                });
                if (!card) {
                    return res.status(400).json({ message: "Cartão não encontrado" });
                }
                if (transaction.type === "expense") {
                    card.value += transaction.value;
                }
                if (transaction.type === "income") {
                    card.value -= transaction.value;
                }
                yield cardsCollection.updateOne({ _id: new mongodb_1.ObjectId(card._id) }, {
                    $set: {
                        value: card.value,
                        updatedAt: new Date().toISOString(),
                    },
                });
                yield transactionsCollection.deleteOne({ id: transactionId });
                res.status(200).json({ message: "Transação deletada com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    getMonthlyBalances(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Obtenha todas as transações do banco de dados
                const transactionsCollection = yield (0, db_1.connectToDatabase)().then((db) => db.collection("transactions"));
                const transactions = yield transactionsCollection.find().toArray();
                // Inicialize o array de meses com propriedades income e outcome
                const yearStart = (0, date_fns_1.startOfYear)(new Date());
                const yearEnd = (0, date_fns_1.endOfYear)(new Date());
                const months = (0, date_fns_1.eachMonthOfInterval)({
                    start: yearStart,
                    end: yearEnd,
                }).map((date) => ({
                    month: (0, date_fns_1.format)(date, "MMMM"),
                    income: 0,
                    outcome: 0,
                }));
                // Itere sobre as transações e acumule os valores
                transactions.forEach((transaction) => {
                    const monthIndex = (0, date_fns_1.getMonth)(new Date(transaction.date));
                    if (transaction.type === "income") {
                        months[monthIndex].income += transaction.value;
                    }
                    else if (transaction.type === "expense") {
                        months[monthIndex].outcome += transaction.value;
                    }
                });
                return res.json(months);
            }
            catch (error) {
                return res
                    .status(500)
                    .json({ error: "An error occurred while fetching monthly balances" });
            }
        });
    }
    mockTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const cardsCollection = db.collection("cards");
                const transactionsCollection = yield (0, db_1.connectToDatabase)().then((db) => db.collection("transactions"));
                const cards = yield cardsCollection.find({ userId }).toArray();
                if (cards.length === 0) {
                    return res
                        .status(400)
                        .json({ message: "Nenhum cartão encontrado para o usuário" });
                }
                const types = ["income", "expense"];
                const now = new Date();
                const yearStart = (0, date_fns_1.startOfYear)(now);
                const yearEnd = (0, date_fns_1.endOfYear)(now);
                const months = (0, date_fns_1.eachMonthOfInterval)({ start: yearStart, end: yearEnd });
                const mockTransactions = [];
                for (let i = 0; i < 50; i++) {
                    const card = cards[Math.floor(Math.random() * cards.length)];
                    const type = types[Math.floor(Math.random() * types.length)];
                    const value = Math.floor(Math.random() * 1000) + 1; // Valor entre 1 e 1000
                    const randomMonth = months[Math.floor(Math.random() * months.length)];
                    const date = (0, date_fns_1.format)((0, date_fns_tz_1.toZonedTime)(randomMonth, "America/Sao_Paulo"), "yyyy-MM-dd'T'HH:mm:ssXXX");
                    const transaction = {
                        id: (0, crypto_1.randomUUID)(),
                        card,
                        value,
                        name: `Mock Transaction ${i + 1}`,
                        type,
                        date,
                        description: `Description for Mock Transaction ${i + 1}`,
                        createdAt: new Date().toISOString(),
                    };
                    mockTransactions.push(transaction);
                    if (type === "expense") {
                        card.value -= value;
                    }
                    else if (type === "income") {
                        card.value += value;
                    }
                    yield cardsCollection.updateOne({ _id: card._id }, {
                        $set: {
                            value: card.value,
                            updatedAt: new Date().toISOString(),
                        },
                    });
                }
                yield transactionsCollection.insertMany(mockTransactions);
                res.status(201).json({
                    message: "50 transações mock criadas com sucesso",
                    transactions: mockTransactions,
                });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    getCurrentMonthBalance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const transactionsCollection = db.collection("transactions");
                const savingsCollection = db.collection("savings");
                const now = new Date();
                let currentMonthStart = (0, date_fns_1.startOfDay)((0, date_fns_1.startOfMonth)(now));
                let currentMonthEnd = (0, date_fns_1.endOfMonth)(now);
                currentMonthStart.setDate(currentMonthStart.getDate() - 1);
                currentMonthEnd.setDate(currentMonthEnd.getDate() - 1);
                let previousMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
                let previousMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
                previousMonthStart.setDate(previousMonthStart.getDate() - 1);
                previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);
                const currentMonthTransactions = yield transactionsCollection
                    .find({
                    "card.userId": userId,
                    date: {
                        $gte: currentMonthStart.toISOString(),
                        $lte: currentMonthEnd.toISOString(),
                    },
                })
                    .toArray();
                let currentIncome = 0;
                let currentOutcome = 0;
                currentMonthTransactions.forEach((transaction) => {
                    if (transaction.type === "income") {
                        currentIncome += transaction.value;
                    }
                    else if (transaction.type === "expense") {
                        currentOutcome += transaction.value;
                    }
                });
                const currentBalance = currentIncome - currentOutcome;
                // Previous month transactions
                const previousMonthTransactions = yield transactionsCollection
                    .find({
                    "card.userId": userId,
                    date: {
                        $gte: previousMonthStart.toISOString(),
                        $lte: previousMonthEnd.toISOString(),
                    },
                })
                    .toArray();
                let previousIncome = 0;
                let previousOutcome = 0;
                previousMonthTransactions.forEach((transaction) => {
                    if (transaction.type === "income") {
                        previousIncome += transaction.value;
                    }
                    else if (transaction.type === "expense") {
                        previousOutcome += transaction.value;
                    }
                });
                const previousBalance = previousIncome - previousOutcome;
                const incomeDifference = previousIncome
                    ? ((currentIncome - previousIncome) / previousIncome) * 100
                    : 0;
                const outcomeDifference = previousOutcome
                    ? ((currentOutcome - previousOutcome) / previousOutcome) * 100
                    : 0;
                const balanceDifference = previousBalance
                    ? ((currentBalance - previousBalance) / previousBalance) * 100
                    : 0;
                // pega todos os savings pela propriedade total_Saved e soma
                const savings = yield savingsCollection.find({ userId }).toArray();
                let totalSaved = 0;
                savings.forEach((saving) => {
                    totalSaved += saving.total_saved;
                });
                console.log("Savings", savings);
                console.log("Total Saved", totalSaved);
                const saving = {
                    current: totalSaved,
                    previous: totalSaved,
                    difference: totalSaved.toFixed(2),
                };
                const income = {
                    current: currentIncome,
                    previous: previousIncome,
                    difference: incomeDifference.toFixed(2),
                };
                const outcome = {
                    current: currentOutcome,
                    previous: previousOutcome,
                    difference: outcomeDifference.toFixed(2),
                };
                const balance = {
                    current: currentBalance,
                    previous: previousBalance,
                    difference: balanceDifference.toFixed(2),
                };
                return res.json({
                    income,
                    outcome,
                    balance,
                    saving,
                });
            }
            catch (error) {
                return res
                    .status(500)
                    .json({ message: "Erro ao obter balanço do mês atual" });
            }
        });
    }
    updateTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, transactionId } = req.params;
                const { cardId, name, value, description, type, date } = req.body;
                if (!cardId || !value || !type || !date) {
                    return res.status(400).json({
                        message: "Cartão, valor, tipo e data são obrigatórios",
                    });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                // Verificar se o usuário existe
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const transactionsCollection = db.collection("transactions");
                // Verificar se a transação existe
                const transaction = yield transactionsCollection.findOne({
                    id: transactionId,
                    "card.userId": userId,
                });
                if (!transaction) {
                    return res.status(400).json({ message: "Transação não encontrada" });
                }
                const cardsCollection = db.collection("cards");
                const card = yield cardsCollection.findOne({
                    _id: new mongodb_1.ObjectId(cardId),
                    userId,
                });
                if (!card) {
                    return res.status(400).json({ message: "Cartão não encontrado" });
                }
                // Atualizar o saldo do cartão
                if (transaction.type === "expense") {
                    card.value += transaction.value; // Reverter o valor da transação original
                }
                else if (transaction.type === "income") {
                    card.value -= transaction.value;
                }
                // Atualizar o saldo do cartão com a nova transação
                if (type === "expense") {
                    card.value -= value;
                }
                else if (type === "income") {
                    card.value += value;
                }
                yield cardsCollection.updateOne({ _id: new mongodb_1.ObjectId(cardId) }, {
                    $set: {
                        value: card.value,
                        updatedAt: new Date().toISOString(),
                    },
                });
                // Atualizar a transação
                yield transactionsCollection.updateOne({ id: transactionId }, {
                    $set: {
                        name,
                        value,
                        description,
                        type,
                        date,
                        updatedAt: new Date().toISOString(),
                    },
                });
                res.status(200).json({ message: "Transação atualizada com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    createEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const eventValidation = this.addNewEventSchema.safeParse(req.body);
                if (!eventValidation.success) {
                    return res.status(400).json({
                        message: "Invalid event data",
                        errors: eventValidation.error.errors,
                    });
                }
                const { title, start, end, repeat, color } = eventValidation.data;
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: req.params.userId });
                if (!user) {
                    return res.status(400).json({ message: "User not found" });
                }
                const eventsCollection = db.collection("events");
                const event = {
                    id: (0, crypto_1.randomUUID)(),
                    userId: req.params.userId,
                    title,
                    start,
                    end,
                    repeat,
                    color,
                    createdAt: new Date().toISOString(),
                };
                yield eventsCollection.insertOne(event);
                res.status(201).json({ message: "Event created successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    listEventsByMonth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const eventsCollection = db.collection("events");
                const events = yield eventsCollection
                    .find({
                    userId,
                })
                    .toArray();
                return res.status(200).json({ events: events });
            }
            catch (error) {
                console.error("Error fetching events:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }
}
exports.TransactionService = TransactionService;
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}T00:00:00.000Z`;
}
function resolveRecurrences(event, startDate, endDate) {
    const resolvedEvents = [];
    let currentDate = new Date(event.start);
    while ((0, date_fns_1.isBefore)(currentDate, endDate)) {
        if ((0, date_fns_1.isAfter)(currentDate, startDate) || (0, date_fns_1.isBefore)(currentDate, startDate)) {
            resolvedEvents.push(Object.assign(Object.assign({}, event), { start: new Date(currentDate) }));
        }
        // Avançar para o próximo dia
        currentDate = (0, date_fns_1.addDays)(currentDate, 1);
    }
    return resolvedEvents;
}
