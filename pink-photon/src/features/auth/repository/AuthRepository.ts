import pool from "@/lib/db";
import { redis } from "@/lib/redis";
import type { UserRow } from "../mapper";

export class AuthRepository {
  async findUserByUsername(
    username: string,
  ): Promise<(UserRow & { password_hash: string }) | null> {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = $1
      LIMIT 1
    `,
      [username],
    );
    return rows[0] || null;
  }

  async checkSession(
    userId: string,
    sessionId: string,
  ): Promise<UserRow | null> {
    const c = await redis.get(`sessions:${userId}:${sessionId}`);
    return c ? JSON.parse(c) : null;
  }
}
