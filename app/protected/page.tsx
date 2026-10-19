import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Timer, type ActiveSession } from "@/components/timer/timer";
import type { Segment } from "@/lib/time";

type ActiveRow = {
  id: string;
  last_active_at: string;
  courses: { name: string } | { name: string }[] | null;
  session_segments: Segment[];
};

async function TimerLoader() {
  const supabase = await createClient();

  const [coursesRes, activeRes] = await Promise.all([
    supabase.from("courses").select("id, name").eq("archived", false).order("name"),
    supabase
      .from("sessions")
      .select("id, last_active_at, courses(name), session_segments(kind, started_at, ended_at)")
      .is("ended_at", null)
      .maybeSingle(),
  ]);

  const row = activeRes.data as unknown as ActiveRow | null;
  let active: ActiveSession | null = null;
  if (row) {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    active = {
      id: row.id,
      courseName: course?.name ?? "Course",
      lastActiveAt: new Date(row.last_active_at).getTime(),
      segments: row.session_segments,
    };
  }

  return (
    <Timer courses={coursesRes.data ?? []} active={active} serverNow={Date.now()} />
  );
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