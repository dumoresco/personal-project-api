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
exports.HabitService = void 0;
const db_1 = require("../database/db");
const crypto_1 = require("crypto");
const mongodb_1 = require("mongodb");
class HabitService {
    createHabit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { title, icon, time, where } = req.body;
                if (!title || !icon || !time || !where) {
                    return res
                        .status(400)
                        .json({ message: "Todos os campos são obrigatórios" });
                }
                const db = yield (0, db_1.connectToDatabase)();
                const usersCollection = db.collection("users");
                const user = yield usersCollection.findOne({ id: userId });
                if (!user) {
                    return res.status(400).json({ message: "Usuário não encontrado" });
                }
                const habit = {
                    id: (0, crypto_1.randomUUID)(),
                    userId,
                    title,
                    icon,
                    time,
                    where,
                    days: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                const habitsCollection = db.collection("habits");
                yield habitsCollection.insertOne(habit);
                res.status(201).json({ message: "Hábito criado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    toggleHabit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, habitId } = req.params;
                const { date } = req.body; // Ex: "2024-07-12"
                const habitObjectId = new mongodb_1.ObjectId(habitId);
                const db = yield (0, db_1.connectToDatabase)();
                const habitsCollection = db.collection("habits");
                const habit = yield habitsCollection.findOne({
                    _id: habitObjectId,
                    userId,
                });
                if (!habit) {
                    return res.status(400).json({ message: "Hábito não encontrado" });
                }
                habit.days[date] = !habit.days[date];
                yield habitsCollection.updateOne({ _id: habitObjectId }, {
                    $set: {
                        days: habit.days,
                        updatedAt: new Date().toISOString(),
                    },
                });
                res.status(200).json({ message: "Hábito atualizado com sucesso" });
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    listHabits(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const habitsCollection = db.collection("habits");
                const habits = yield habitsCollection.find({ userId }).toArray();
                res.status(200).json(habits);
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
    // rota para criar um habitos com base no array de mockHabits
    createMockHabits(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const db = yield (0, db_1.connectToDatabase)();
                const habitsCollection = db.collection("habits");
                const mockHabits = [
                    {
                        id: new mongodb_1.ObjectId().toString(),
                        userId,
                        title: "Read a book",
                        icon: "📚",
                        time: { type: "AM", start: "08:00", end: "09:00" },
                        where: "Home",
                        days: {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: new mongodb_1.ObjectId().toString(),
                        userId,
                        title: "Workout",
                        icon: "💪",
                        time: { type: "AM", start: "09:00", end: "10:00" },
                        where: "Gym",
                        days: {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: new mongodb_1.ObjectId().toString(),
                        userId,
                        title: "Work",
                        icon: "💼",
                        time: { type: "AM", start: "10:00", end: "12:00" },
                        where: "Office",
                        days: {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: new mongodb_1.ObjectId().toString(),
                        userId,
                        title: "Lunch",
                        icon: "🍱",
                        time: { type: "PM", start: "12:00", end: "13:00" },
                        where: "Home",
                        days: {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        id: new mongodb_1.ObjectId().toString(),
                        userId,
                        title: "Meeting",
                        icon: "👥",
                        time: { type: "PM", start: "13:00", end: "14:00" },
                        where: "Office",
                        days: {},
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ];
                yield habitsCollection.insertMany(mockHabits);
                res.status(201).json({ message: "Hábitos criados com sucesso" });
            }
            catch (error) {
                res
                    .status(500)
                    .json({ message: "Erro interno do servidor ao criar hábitos" });
            }
        });
    }
    listHabitsByMonth(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const { month = "", year } = req.query; // Ex: ?month=7&year=2024
                const db = yield (0, db_1.connectToDatabase)();
                const habitsCollection = db.collection("habits");
                const habits = yield habitsCollection.find({ userId }).toArray();
                const filteredHabits = habits.map((habit) => {
                    const days = Object.keys(habit.days)
                        .filter((date) => {
                        const habitDate = new Date(date);
                        return (habitDate.getMonth() + 1 === parseInt(month) &&
                            habitDate.getFullYear() === parseInt(year));
                    })
                        .reduce((acc, date) => {
                        acc[date] = habit.days[date];
                        return acc;
                    }, {});
                    return Object.assign(Object.assign({}, habit), { days });
                });
                res.status(200).json(filteredHabits);
            }
            catch (error) {
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });
    }
}
exports.HabitService = HabitService;
