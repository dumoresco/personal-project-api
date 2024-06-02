import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { ObjectId, Transaction } from "mongodb";
import { start } from "repl";
import {
  eachMonthOfInterval,
  endOfYear,
  format,
  getMonth,
  startOfYear,
} from "date-fns";

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
interface MonthlyTransaction {
  income: number;
  outcome: number;
}

interface MonthlyTransactions {
  [key: number]: MonthlyTransaction;
}
export class TransactionService {
  async createTransaction(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { cardId, name, value, description, type, date } = req.body;

      if (!cardId || !value) {
        return res.status(400).json({
          message: "Cartão, valor são obrigatórios",
        });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const cardsCollection = db.collection("cards");

      const card = await cardsCollection.findOne({
        _id: new ObjectId(cardId),
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
        id: randomUUID(),
        card,
        value,
        name,
        type,
        date,
        description,
        createdAt: new Date().toISOString(),
      };

      await transactionsCollection.insertOne(transaction);
      if (type === "expense") {
        card.value -= value;
      }

      if (type === "income") {
        card.value += value;
      }

      await cardsCollection.updateOne(
        { _id: new ObjectId(cardId) },
        {
          $set: {
            value: card.value,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.status(201).json({ message: "Transação realizada com sucesso" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { search, bank, startDate, endDate } = req.query;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const transactionsCollection = db.collection("transactions");

      let query: any = { "card.userId": userId };

      if (search) {
        query = {
          ...query,
          name: { $regex: search, $options: "i" }, // Filtra pelo nome da transação, case-insensitive
        };
      }

      // filtra pelo card.id
      if (bank && bank !== "all") {
        query = {
          ...query,
          "card.id": bank,
        };
      }

      if (startDate && endDate) {
        query.date = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      const transactions = await transactionsCollection.find(query).toArray();

      res.status(200).json({ message: "Transações encontradas", transactions });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  // deleteAllTransactions
  // ao deletar todas as transaçoes de um usuario, o saldo de todos os cartões cadastrados por ele deve ser zerado
  async deleteAllTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { search } = req.query;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const cardsCollection = db.collection("cards");

      const cards = await cardsCollection.find({ userId }).toArray();

      for (const card of cards) {
        await cardsCollection.updateOne(
          { _id: new ObjectId(card._id) },
          {
            $set: {
              value: 0,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }

      const transactionsCollection = db.collection("transactions");

      await transactionsCollection.deleteMany({ "card.userId": userId });

      res.status(200).json({ message: "Transações deletadas com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  // deletar uma transação
  // ao deletar uma transação, o saldo do cartão deve ser atualizado de acordo com o valor da transação e o tipo dela

  async deleteTransaction(req: Request, res: Response) {
    try {
      const { userId, transactionId } = req.params;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const transactionsCollection = db.collection("transactions");

      const transaction = await transactionsCollection.findOne({
        id: transactionId,
        "card.userId": userId,
      });

      if (!transaction) {
        return res.status(400).json({ message: "Transação não encontrada" });
      }

      const cardsCollection = db.collection("cards");

      const card = await cardsCollection.findOne({
        _id: new ObjectId(transaction.card._id),
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

      await cardsCollection.updateOne(
        { _id: new ObjectId(card._id) },
        {
          $set: {
            value: card.value,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      await transactionsCollection.deleteOne({ id: transactionId });

      res.status(200).json({ message: "Transação deletada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
  async getMonthlyBalances(req: Request, res: Response): Promise<Response> {
    try {
      // Obtenha todas as transações do banco de dados
      const transactionsCollection = await connectToDatabase().then((db) =>
        db.collection("transactions")
      );
      const transactions = await transactionsCollection.find().toArray();

      // Inicialize o array de meses com propriedades income e outcome
      const yearStart = startOfYear(new Date());
      const yearEnd = endOfYear(new Date());
      const months = eachMonthOfInterval({
        start: yearStart,
        end: yearEnd,
      }).map((date) => ({
        month: format(date, "MMMM"),
        income: 0,
        outcome: 0,
      }));

      // Itere sobre as transações e acumule os valores
      transactions.forEach((transaction) => {
        const monthIndex = getMonth(new Date(transaction.date));
        console.log("Month index:", monthIndex);
        if (transaction.type === "income") {
          months[monthIndex].income += transaction.value;
          console.log("Income:", months[monthIndex].income);
        } else if (transaction.type === "expense") {
          months[monthIndex].outcome += transaction.value;
        }
      });

      console.log("Transactions:", transactions);

      return res.json(months);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while fetching monthly balances" });
    }
  }
}
