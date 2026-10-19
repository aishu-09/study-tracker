import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsernameForm } from "@/components/user/username-form";
import { LogoutButton } from "@/components/logout-button";

async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Profile</h2>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm text-muted-foreground">
            Username
          </label>
          <UsernameForm current={profile?.username ?? ""} />
        </div>
      </section>

      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-medium">Session</h2>
        <LogoutButton />
      </section>
    </>
  );
}

export default function UserPage() {
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">User</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <Account />
      </Suspense>
    </div>
  );
}