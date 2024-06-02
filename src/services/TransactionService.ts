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

import { toZonedTime } from "date-fns-tz";

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
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const {
        search,
        bank,
        startDate,
        endDate,
        limit = "10",
        page = "1",
      } = req.query;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const transactionsCollection = db.collection("transactions");

      let query: any = {};

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

      // Convert limit and page to numbers
      const limitNumber = parseInt(limit as string, 10);
      const pageNumber = parseInt(page as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      console.log("Query:", query);
      console.log("Limit:", limitNumber, "Page:", pageNumber, "Skip:", skip);
      const transactions = await transactionsCollection
        .find(query)
        .skip(skip)
        .limit(limitNumber)
        .toArray();

      // Get the total count of transactions for the query
      const totalCount = await transactionsCollection.countDocuments(query);

      console.log("Transactions:", transactions);

      res.status(200).json({
        message: "Transações encontradas",
        transactions,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
        totalCount,
      });
    } catch (error) {
      console.log("Error:", error);
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
        if (transaction.type === "income") {
          months[monthIndex].income += transaction.value;
        } else if (transaction.type === "expense") {
          months[monthIndex].outcome += transaction.value;
        }
      });

      return res.json(months);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "An error occurred while fetching monthly balances" });
    }
  }

  async mockTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const cardsCollection = db.collection("cards");
      const transactionsCollection = await connectToDatabase().then((db) =>
        db.collection("transactions")
      );
      const cards = await cardsCollection.find({ userId }).toArray();

      if (cards.length === 0) {
        return res
          .status(400)
          .json({ message: "Nenhum cartão encontrado para o usuário" });
      }

      const types = ["income", "expense"];
      const now = new Date();
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

      const mockTransactions = [];

      for (let i = 0; i < 50; i++) {
        const card = cards[Math.floor(Math.random() * cards.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const value = Math.floor(Math.random() * 1000) + 1; // Valor entre 1 e 1000
        const randomMonth = months[Math.floor(Math.random() * months.length)];
        const date = format(
          toZonedTime(randomMonth, "America/Sao_Paulo"),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        );

        const transaction = {
          id: randomUUID(),
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
        } else if (type === "income") {
          card.value += value;
        }

        await cardsCollection.updateOne(
          { _id: card._id },
          {
            $set: {
              value: card.value,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }

      await transactionsCollection.insertMany(mockTransactions);

      res.status(201).json({
        message: "50 transações mock criadas com sucesso",
        transactions: mockTransactions,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
