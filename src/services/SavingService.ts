import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

require("dotenv").config();

export class SavingService {
  async listSavings(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const savingsCollection = db.collection("savings");

      const savings = await savingsCollection.find({ userId }).toArray();

      res.status(200).json({
        message: "Savings encontrados",
        savings,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async createSaving(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { name, monthly_save, goal, total_saved } = req.body;

      if (!name || !monthly_save || !goal) {
        return res.status(400).json({
          message: "Nome, valor mensal e meta são obrigatórios",
        });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const savingsCollection = db.collection("savings");

      const saving = {
        id: randomUUID(),
        name,
        monthly_save,
        total_saved,
        goal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await savingsCollection.insertOne({ ...saving, userId });

      console.log("Saving cadastrado com sucesso", saving);

      res
        .status(201)
        .json({ message: "Saving cadastrado com sucesso", saving });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
