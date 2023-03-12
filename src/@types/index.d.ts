declare module 'next-auth/client';
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    activeSubscription: string | null;
  }
}