import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

export class HabitService {
  async createHabit(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { title, icon, time, where } = req.body;

      if (!title || !icon || !time || !where) {
        return res
          .status(400)
          .json({ message: "Todos os campos são obrigatórios" });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const habit = {
        id: randomUUID(),
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

      await habitsCollection.insertOne(habit);

      res.status(201).json({ message: "Hábito criado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async toggleHabit(req: Request, res: Response) {
    try {
      const { userId, habitId } = req.params;
      const { date } = req.body; // Ex: "2024-07-12"

      const habitObjectId = new ObjectId(habitId);

      const db = await connectToDatabase();
      const habitsCollection = db.collection("habits");

      const habit = await habitsCollection.findOne({
        _id: habitObjectId,
        userId,
      });
      if (!habit) {
        return res.status(400).json({ message: "Hábito não encontrado" });
      }

      habit.days[date] = !habit.days[date];

      await habitsCollection.updateOne(
        { _id: habitObjectId },
        {
          $set: {
            days: habit.days,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.status(200).json({ message: "Hábito atualizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listHabits(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const habitsCollection = db.collection("habits");

      const habits = await habitsCollection.find({ userId }).toArray();

      res.status(200).json(habits);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  // rota para criar um habitos com base no array de mockHabits
  async createMockHabits(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const habitsCollection = db.collection("habits");

      const mockHabits = [
        {
          id: new ObjectId().toString(),
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
          id: new ObjectId().toString(),
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
          id: new ObjectId().toString(),
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
          id: new ObjectId().toString(),
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
          id: new ObjectId().toString(),
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

      await habitsCollection.insertMany(mockHabits);

      res.status(201).json({ message: "Hábitos criados com sucesso" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Erro interno do servidor ao criar hábitos" });
    }
  }

  async listHabitsByMonth(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { month = "", year } = req.query; // Ex: ?month=7&year=2024

      const db = await connectToDatabase();
      const habitsCollection = db.collection("habits");

      const habits = await habitsCollection.find({ userId }).toArray();

      const filteredHabits = habits.map((habit) => {
        const days = Object.keys(habit.days)
          .filter((date) => {
            const habitDate = new Date(date);
            return (
              habitDate.getMonth() + 1 === parseInt(month as string) &&
              habitDate.getFullYear() === parseInt(year as string)
            );
          })
          .reduce((acc: { [key: string]: boolean }, date) => {
            acc[date] = habit.days[date];
            return acc;
          }, {});

        return { ...habit, days };
      });

      res.status(200).json(filteredHabits);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
