"use client";

import { useActionState } from "react";
import { updateUsername, type ProfileFormState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UsernameForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateUsername,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="username"
          defaultValue={current}
          placeholder="Choose a username"
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]+"
          title="Letters, numbers, and underscores only"
          autoComplete="username"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-muted-foreground">Username saved.</p>
      )}
    </form>
  );
}