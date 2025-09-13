export interface User {
  id: string; // UUID
  username: string;
  fullName?: string;
  avatarUrl?: string;
  email?: string;
  role: "reporter" | "reader" | "admin";
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
