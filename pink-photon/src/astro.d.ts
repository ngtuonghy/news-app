/// <reference types="astro/client" />

import type { User } from "./features/auth/domain/User";

declare global {
  namespace App {
    interface Locals extends Record<string, any> {
      user?: User | null;
    }
  }
}
