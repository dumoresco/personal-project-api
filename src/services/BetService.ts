import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

require("dotenv").config();

interface Bet {
  id: string;
  userId: string;
  value: number;
  odd: number;
  status: "pending" | "win" | "loss";
  resultado: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  banca: number;
  createdAt: string;
  updatedAt: string;
}

export class BetService {
  async createBet(req: Request, res: Response) {
    try {
      const { value, odd } = req.body;
      const { userId } = req.params;

      if (!value || !odd) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({ id: userId });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBet: Bet = {
        id: randomUUID(),
        userId,
        value,
        odd,
        status: "pending",
        resultado: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const betsCollection = db.collection("bets");

      const result = await betsCollection.insertOne(newBet);
      if (!result.acknowledged) {
        return res.status(500).json({ message: "Error creating bet" });
      }
      return res
        .status(201)
        .json({ message: "Bet created successfully", bet: newBet });
    } catch (error) {
      console.error("Error creating bet:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateBetStatus(req: Request, res: Response) {
    try {
      const { betId } = req.params;
      const { status } = req.body;

      if (!status || !["win", "loss"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const db = await connectToDatabase();
      const betsCollection = db.collection("bets");
      const usersCollection = db.collection("users");

      const bet = await betsCollection.findOne({ id: betId });

      if (!bet) {
        return res.status(404).json({ message: "Bet not found" });
      }

      let resultado = 0;
      if (status === "win") {
        resultado = bet.value * bet.odd;
      } else if (status === "loss") {
        resultado = -bet.value;
      }

      const user = await usersCollection.findOne({ id: bet.userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newBanca = user.banca + resultado;

      await usersCollection.updateOne(
        { id: bet.userId },
        { $set: { banca: newBanca, updatedAt: new Date().toISOString() } }
      );

      const result = await betsCollection.updateOne(
        { id: betId },
        {
          $set: {
            status,
            resultado,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Bet not found" });
      }

      return res
        .status(200)
        .json({ message: "Bet status updated successfully" });
    } catch (error) {
      console.error("Error updating bet status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async listBets(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const betsCollection = db.collection("bets");
      const usersCollection = db.collection("users");

      const bets = await betsCollection.find({ userId }).toArray();
      const user = await usersCollection.findOne({ id: userId });

      // se user.banca não existir, cria com valor de 1000
      if (!user?.banca) {
        await usersCollection.updateOne(
          { id: userId },
          { $set: { banca: 1000, updatedAt: new Date().toISOString() } }
        );
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ bets, banca: user.banca });
    } catch (error) {
      console.error("Error listing bets:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteAllBets(req: Request, res: Response) {
    try {
      const db = await connectToDatabase();
      const betsCollection = db.collection("bets");
      const usersCollection = db.collection("users");

      const result = await betsCollection.deleteMany({});
      await usersCollection.updateMany({}, { $set: { banca: 1000 } });

      return res.status(200).json({
        message: "All bets deleted successfully and all balances reset",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all bets:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
