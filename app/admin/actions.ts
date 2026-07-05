"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createToken, requireAuth, SESSION_COOKIE } from "@/lib/auth";
import { addItem as addManifestItem } from "@/lib/manifest";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!expected || !secret) throw new Error("서버 환경변수 미설정");
  if (password !== expected) redirect("/admin/login?error=1");
  const token = await createToken(secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function addItem(input: {
  url: string; pathname: string; width: number; height: number;
}): Promise<void> {
  await requireAuth();
  await addManifestItem(input);
  revalidatePath("/");
  revalidatePath("/admin");
}
