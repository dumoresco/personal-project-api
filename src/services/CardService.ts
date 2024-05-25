import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

require("dotenv").config();
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  pin: number;
}
export class CardService {
  // createCard
  async createCard(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { number, cvv, bank, type, validity } = req.body;

      if (!number || !cvv || !bank || !type || !validity) {
        return res.status(400).json({
          message:
            "Número do cartão, CVV, banco, tipo e validade são obrigatórios",
        });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const card = {
        id: randomUUID(),
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

      const existingCard = await cardsCollection.findOne({
        number,
        userId,
      });

      if (existingCard) {
        return res.status(400).json({ message: "Cartão já cadastrado" });
      }

      const cards = await cardsCollection.find({ userId }).toArray();

      if (cards.length >= 10) {
        return res.status(400).json({ message: "Limite de cartões atingido" });
      }

      await cardsCollection.insertOne({ ...card, userId });

      res.status(201).json({ message: "Cartão criado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listCards(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const cardsCollection = db.collection("cards");

      const cards = await cardsCollection.find({ userId }).toArray();

      cards.forEach((card) => {
        if (!card.value) {
          card.value = 0;
        }
      });

      res.status(200).json(cards);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteCard(req: Request, res: Response) {
    try {
      const { userId, cardId } = req.params;

      const cardObjectId = new ObjectId(cardId);

      const db = await connectToDatabase();
      const cardsCollection = db.collection("cards");

      const card = await cardsCollection.findOne({ _id: cardObjectId, userId });
      if (!card) {
        return res.status(400).json({ message: "Cartão não encontrado" });
      }

      await cardsCollection.deleteOne({ _id: cardObjectId });

      res.status(200).json({ message: "Cartão deletado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateCardShowAtDashboard(req: Request, res: Response) {
    try {
      const { userId, cardId } = req.params;
      const { show_at_dashboard } = req.body;

      const cardObjectId = new ObjectId(cardId);

      const db = await connectToDatabase();
      const cardsCollection = db.collection("cards");

      const card = await cardsCollection.findOne({
        _id: cardObjectId,
        userId,
      });
      if (!card) {
        return res.status(400).json({ message: "Cartão não encontrado" });
      }

      await cardsCollection.updateOne(
        { _id: cardObjectId },
        {
          $set: {
            show_at_dashboard,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.status(200).json({ message: "Cartão atualizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
