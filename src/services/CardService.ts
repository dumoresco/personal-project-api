import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";

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
        number,
        cvv,
        bank,
        type,
        validity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // insere o cartão em uma nova coleção chamada cards e adiciona o id do usuário
      const cardsCollection = db.collection("cards");
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

      res.status(200).json(cards);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
