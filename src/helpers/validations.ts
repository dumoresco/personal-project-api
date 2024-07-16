import { Collection } from "mongoose";
import { CreateUserPayload } from "../models/user/IUser";
import { Db } from "mongodb";
import bcrypt from "bcrypt";
export const validateCreateUserFields = (payload: CreateUserPayload) => {
  const { name, email, password } = payload;
  const errors = [];
  if (!name) {
    errors.push("O campo 'name' é obrigatório");
  }
  if (!email) {
    errors.push("O campo 'email' é obrigatório");
  }
  if (!password) {
    errors.push("O campo 'password' é obrigatório");
  }

  if (!email && !password && !name) {
    errors.push("Nenhum campo foi enviado");
  }
  throw new Error(errors.join(", "));
};

export const validatePassword = async (user: any, password: string) => {
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new Error("E-mail ou senha incorretos");
  }
};

export const validateEmailAlreadyExists = async (email: string, db: Db) => {
  const usersCollection = db.collection<any>("users");
  const existingEmail = await usersCollection.findOne({ email });

  if (existingEmail) {
    throw new Error("Email já cadastrado");
  }
};
