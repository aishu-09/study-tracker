"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CourseFormState = { error?: string; success?: boolean };

export async function createCourse(
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a course name." };
  if (name.length > 50) return { error: "Keep it under 50 characters." };

  const supabase = await createClient();
  // user_id fills in automatically from auth.uid()
  const { error } = await supabase.from("courses").insert({ name });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a course with that name." };
    }
    return { error: "Couldn't create the course. Try again." };
  }

  revalidatePath("/protected", "layout");
  return { success: true };
}

export async function archiveCourse(courseId: string) {
  const supabase = await createClient();
  await supabase.from("courses").update({ archived: true }).eq("id", courseId);
  revalidatePath("/protected", "layout");
}