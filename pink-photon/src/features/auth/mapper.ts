import type { User } from "./domain/User";

export interface UserRow {
  id: string; // UUID
  username: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  role: "reporter" | "reader" | "admin";
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export function mapUserRowToEntity(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name || undefined,
    avatarUrl: row.avatar_url || undefined,
    email: row.email || undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
