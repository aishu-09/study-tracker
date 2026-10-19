"use client";

import { useActionState } from "react";
import { createCourse, type CourseFormState } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CourseForm() {
  const [state, formAction, pending] = useActionState<CourseFormState, FormData>(
    createCourse,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="name"
          placeholder="e.g. MATH 100"
          maxLength={50}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add course"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}