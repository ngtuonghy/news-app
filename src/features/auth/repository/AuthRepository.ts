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

  async createUser(data: {
		username: string;
		password_hash: string;
		full_name?: string;
	}): Promise<boolean> {
		try {
			const { rows } = await pool.query(
				`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ($1, $2, $3 , $4)
      RETURNING *
    `,
				[data.username, data.password_hash, data.full_name || null, 'reader'],
			);
			return !!rows[0];
		} catch (error) {
			console.error("Error creating user:", error);
			throw error;
		} finally {
		}
	}
}
