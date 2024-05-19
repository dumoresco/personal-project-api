import { model, Document, Schema } from "mongoose";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserResponse {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

// src/models/User.ts

interface User extends Document {
  nome: string;
  email: string;
  senha: string;
  createdAt: string;
  updatedAt: string;
  // Outros campos conforme necessário
}

const userSchema = new Schema<User>({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

const UserModel = model<User>("User", userSchema);

export default UserModel;
