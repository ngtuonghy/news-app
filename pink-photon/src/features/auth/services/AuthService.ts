import { redis } from "@/lib/redis";
import { AuthRepository } from "../repository/AuthRepository";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { mapUserRowToEntity, type UserRow } from "../mapper";
import type { User } from "../domain/User";

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

export class AuthService {
  private repo = new AuthRepository();
  private saltRounds = 12;

  async login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; message?: string; user?: UserRow }> {
    const user = await this.repo.findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, message: "Password invalid" };
    }

    return { success: true, user };
  }
  async saveSession(user: UserRow): Promise<string> {
    const token = generateSessionId();
    await redis.set(
      `sessions:${user.id}:${token}`,
      JSON.stringify(user),
      "EX",
      60 * 60 * 24 * 365,
    );
    return token;
  }
  async removeSession(userId: string, token: string): Promise<void> {
    await redis.del(`sessions:${userId}:${token}`);
  }

  async register(
    username: string,
    password: string,
    fullName?: string,
    email?: string,
    avatarUrl?: string,
  ): Promise<{ success: boolean; message?: string; user?: UserRow }> {
    const existingUser = await this.repo.findUserByUsername(username);
    if (existingUser) {
      return { success: false, message: "Username already taken" };
    }
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    return { success: true, message: "User registered successfully" };
  }
  async getUser(userId: string, sessionId: string): Promise<User | null> {
    const t = await this.repo.checkSession(userId, sessionId);
    if (!t) return null;
    return mapUserRowToEntity(t);
  }
}
