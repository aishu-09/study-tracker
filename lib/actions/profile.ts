"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; success?: boolean };

export async function updateUsername(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const username = String(formData.get("username") ?? "").trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return {
      error: "Use 3-20 characters: letters, numbers, or underscores.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You're signed out. Log in again." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") return { error: "That username is taken." };
    if (error.code === "23514") {
      return { error: "Use 3-20 characters: letters, numbers, or underscores." };
    }
    return { error: "Couldn't save your username. Try again." };
  }

  revalidatePath("/protected/user");
  return { success: true };
}