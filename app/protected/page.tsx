import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Timer } from "@/components/timer/timer";

async function TimerLoader() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("archived", false)
    .order("name");

  return <Timer courses={courses ?? []} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <TimerLoader />
    </Suspense>
  );
}