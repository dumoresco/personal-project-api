import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { randomUUID } from "crypto";
import { Document, ObjectId, Transaction, WithId } from "mongodb";
import { start } from "repl";
import {
  addDays,
  addWeeks,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

import { getTimezoneOffset, toZonedTime } from "date-fns-tz";
import { z } from "zod";

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

      const transactions = await transactionsCollection
        .find(query)
        .skip(skip)
        .limit(limitNumber)
        .toArray();

      // Get the total count of transactions for the query
      const totalCount = await transactionsCollection.countDocuments(query);

      res.status(200).json({
        message: "Transações encontradas",
        transactions,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
        totalCount,
      });
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
  async getCurrentMonthBalance(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");
      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      const transactionsCollection = db.collection("transactions");
      const savingsCollection = db.collection("savings");

      const now = new Date();
      let currentMonthStart = startOfDay(startOfMonth(now));
      let currentMonthEnd = endOfMonth(now);
      currentMonthStart.setDate(currentMonthStart.getDate() - 1);
      currentMonthEnd.setDate(currentMonthEnd.getDate() - 1);

      let previousMonthStart = startOfMonth(subMonths(now, 1));
      let previousMonthEnd = endOfMonth(subMonths(now, 1));
      previousMonthStart.setDate(previousMonthStart.getDate() - 1);
      previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

      const currentMonthTransactions = await transactionsCollection
        .find({
          "card.userId": userId,
          date: {
            $gte: currentMonthStart.toISOString(),
            $lte: currentMonthEnd.toISOString(),
          },
        })
        .toArray();

      let currentIncome = 0;
      let currentOutcome = 0;

      currentMonthTransactions.forEach((transaction) => {
        if (transaction.type === "income") {
          currentIncome += transaction.value;
        } else if (transaction.type === "expense") {
          currentOutcome += transaction.value;
        }
      });

      const currentBalance = currentIncome - currentOutcome;

      // Previous month transactions
      const previousMonthTransactions = await transactionsCollection
        .find({
          "card.userId": userId,
          date: {
            $gte: previousMonthStart.toISOString(),
            $lte: previousMonthEnd.toISOString(),
          },
        })
        .toArray();

      let previousIncome = 0;
      let previousOutcome = 0;

      previousMonthTransactions.forEach((transaction) => {
        if (transaction.type === "income") {
          previousIncome += transaction.value;
        } else if (transaction.type === "expense") {
          previousOutcome += transaction.value;
        }
      });

      const previousBalance = previousIncome - previousOutcome;
      const incomeDifference = previousIncome
        ? ((currentIncome - previousIncome) / previousIncome) * 100
        : 0;
      const outcomeDifference = previousOutcome
        ? ((currentOutcome - previousOutcome) / previousOutcome) * 100
        : 0;
      const balanceDifference = previousBalance
        ? ((currentBalance - previousBalance) / previousBalance) * 100
        : 0;

      // pega todos os savings pela propriedade total_Saved e soma
      const savings = await savingsCollection.find({ userId }).toArray();
      let totalSaved = 0;

      savings.forEach((saving) => {
        totalSaved += saving.total_saved;
      });

      console.log("Savings", savings);
      console.log("Total Saved", totalSaved);

      const saving = {
        current: totalSaved,
        previous: totalSaved,
        difference: totalSaved.toFixed(2),
      };

      const income = {
        current: currentIncome,
        previous: previousIncome,
        difference: incomeDifference.toFixed(2),
      };

      const outcome = {
        current: currentOutcome,
        previous: previousOutcome,
        difference: outcomeDifference.toFixed(2),
      };

      const balance = {
        current: currentBalance,
        previous: previousBalance,
        difference: balanceDifference.toFixed(2),
      };

      return res.json({
        income,
        outcome,
        balance,
        saving,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro ao obter balanço do mês atual" });
    }
  }

  addNewEventSchema = z.object({
    title: z.string().min(1, { message: "O título é obrigatório" }),
    start: z.string().min(1, { message: "A data de início é obrigatória" }),
    end: z.string().min(1, { message: "A data de término é obrigatória" }),
    repeat: z.enum(["daily", "weekly", "monthly", "yearly"], {
      message: "Repetição inválida",
    }),
    color: z.enum(["purple", "blue", "green", "yellow", "red"], {
      message: "Cor inválida",
    }),
  });

  async createEvent(req: Request, res: Response) {
    try {
      const eventValidation = this.addNewEventSchema.safeParse(req.body);
      if (!eventValidation.success) {
        return res.status(400).json({
          message: "Invalid event data",
          errors: eventValidation.error.errors,
        });
      }

      const { title, start, end, repeat, color } = eventValidation.data;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const user = await usersCollection.findOne({ id: req.params.userId });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const eventsCollection = db.collection("events");

      const event = {
        id: randomUUID(),
        userId: req.params.userId,
        title,
        start,
        end,
        repeat,
        color,
        createdAt: new Date().toISOString(),
      };

      await eventsCollection.insertOne(event);

      res.status(201).json({ message: "Event created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
  async listEventsByMonth(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const db = await connectToDatabase();
      const eventsCollection = db.collection("events");

      const events = await eventsCollection
        .find({
          userId,
        })
        .toArray();

      return res.status(200).json({ events: events });
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Função para formatar uma data para o formato ISO 8601 (yyyy-MM-ddTHH:mm:ss.SSSZ)
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function resolveRecurrences(
  event: WithId<Document>,
  startDate: Date,
  endDate: Date
) {
  const resolvedEvents = [];
  let currentDate = new Date(event.start);

  while (isBefore(currentDate, endDate)) {
    if (isAfter(currentDate, startDate) || isBefore(currentDate, startDate)) {
      resolvedEvents.push({ ...event, start: new Date(currentDate) });
    }

    // Avançar para o próximo dia
    currentDate = addDays(currentDate, 1);
  }

  return resolvedEvents;
}
