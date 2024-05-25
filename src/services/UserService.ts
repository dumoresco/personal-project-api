import { Request, Response } from "express";
import { connectToDatabase } from "../database/db";
import { v4 as uuidv4, v4 } from "uuid";
import jwt from "jsonwebtoken";
require("dotenv").config();

import bcrypt from "bcrypt";
import { getNextSequenceValue } from "../helpers";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

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

export class UserService {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, username } = req.body;
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Nome, email e senha são obrigatórios" });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      // Cria um PIN de 6 digitos para o usuário
      const generetePinSixDigits = () => {
        return Math.floor(100000 + Math.random() * 900000);
      };

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: randomUUID(),
        name,
        username,
        pin: generetePinSixDigits(),
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await usersCollection.insertOne(newUser);
      newUser.id = result.insertedId.toHexString();

      res.status(201).json({ message: "Usuário registrado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "E-mail ou senha incorretos" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: "E-mail ou senha incorretos" });
      }
      const jwtSecret = process.env.JWT_SECRET;

      // cria um OTP de 6 digitos para o usuário
      const token = jwt.sign({ id: user.id }, jwtSecret as string, {
        expiresIn: "1d",
      });

      res.status(200).json({
        msg: "Login realizado com sucesso",
        token,
        user,
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  async loginOtp(req: Request, res: Response) {
    try {
      const { pin } = req.body;

      const db = await connectToDatabase();
      const usersCollection = db.collection<User>("users");
      const user = await usersCollection.findOne({ pin });

      if (!user) {
        return res.status(401).json({ error: " PIN incorreto" });
      }

      const jwtSecret = process.env.JWT_SECRET;

      // cria um OTP de 6 digitos para o usuário
      const token = jwt.sign({ id: user.id }, jwtSecret as string, {
        expiresIn: "1d",
      });

      res.status(200).json({
        msg: "Login realizado com sucesso",
        token,
        user,
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const { userId } = req.params;

      // Verificar se oldPassword e newPassword são fornecidos
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          message: "É necessário fornecer a senha antiga e a nova senha",
        });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection("users");

      // Verificar se o usuário existe
      const user = await usersCollection.findOne({ id: userId });
      if (!user) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }

      // Verificar se a senha antiga está correta
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Senha antiga incorreta" });
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar a senha do usuário
      await usersCollection.updateOne(
        { id: userId },
        // updateAt é a data atual
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      // retorna obj data com o usuario atualizado
      res.status(200).json({ message: "Senha resetada com sucesso", user });
    } catch (error) {
      console.log("Erro ao resetar a senha", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
