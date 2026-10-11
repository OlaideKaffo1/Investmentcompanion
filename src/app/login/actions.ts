"use server";

import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code";
  email: string;
  message?: string;
  error?: string;
};

// One action drives both steps: the form posts an "intent" of "send" (email
// me a code) or "verify" (check the code I typed).
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  return formData.get("intent") === "verify"
    ? verifyCode(email, String(formData.get("code") ?? ""))
    : sendCode(email);
}

async function sendCode(email: string): Promise<LoginState> {
  if (!email.includes("@")) {
    return { step: "email", email, error: "Enter your email address." };
  }

  // Only the owner's address is ever sent a code. Everyone else sees the same
  // message, so the page doesn't reveal which address is the right one.
  if (isAllowedEmail(email)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      console.error("signInWithOtp failed:", error.message);
      return {
        step: "email",
        email,
        error:
          error.status === 429
            ? "Too many codes requested. Wait a minute and try again."
            : "Couldn't send the code. Try again in a moment.",
      };
    }
  }

  return {
    step: "code",
    email,
    message: `If ${email} is the right address, a sign-in code is on its way.`,
  };
}

async function verifyCode(email: string, code: string): Promise<LoginState> {
  const token = code.replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) {
    return { step: "code", email, error: "Enter the code from the email." };
  }

  const failed: LoginState = {
    step: "code",
    email,
    error: "That code didn't work. It may have expired, so request a new one.",
  };
  if (!isAllowedEmail(email)) return failed;

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return failed;

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
