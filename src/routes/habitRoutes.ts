import express from "express";
import { HabitService } from "../services/HabitService";

const habitService = new HabitService();
const router = express.Router();

router.post("/users/:userId/habits", habitService.createHabit);
router.patch("/users/:userId/habits/:habitId/toggle", habitService.toggleHabit);
router.get("/users/:userId/habits", habitService.listHabits);
router.get("/users/:userId/habits/month", habitService.listHabitsByMonth);
// createMockHabits
router.post("/users/:userId/habits/mock", habitService.createMockHabits);
export default router;
