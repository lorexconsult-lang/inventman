import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const subject = data?.claims?.sub;
  if (error || typeof subject !== "string") redirect("/auth/login");
  return { id: subject };
}
