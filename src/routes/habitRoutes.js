"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const HabitService_1 = require("../services/HabitService");
const habitService = new HabitService_1.HabitService();
const router = express_1.default.Router();
router.post("/users/:userId/habits", habitService.createHabit);
router.patch("/users/:userId/habits/:habitId/toggle", habitService.toggleHabit);
router.get("/users/:userId/habits", habitService.listHabits);
router.get("/users/:userId/habits/month", habitService.listHabitsByMonth);
// createMockHabits
router.post("/users/:userId/habits/mock", habitService.createMockHabits);
exports.default = router;
