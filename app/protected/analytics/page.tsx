import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/analytics/course-form";
import { CourseList } from "@/components/analytics/course-list";
import {
  SessionList,
  type CourseWithSessions,
} from "@/components/analytics/session-list";
import {
  StudyPieChart,
  type CourseStudy,
} from "@/components/analytics/study-pie-chart";

async function Courses() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("archived", false)
    .order("name");

  return <CourseList courses={courses ?? []} />;
}

async function StudyBreakdown() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_study_time")
    .select("course_id, name, study_seconds")
    .gt("study_seconds", 0)
    .order("study_seconds", { ascending: false });

  return <StudyPieChart data={(data ?? []) as CourseStudy[]} />;
}

async function Sessions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(
      "id, name, archived, sessions(id, started_at, ended_at, session_segments(kind, started_at, ended_at))",
    )
    .not("sessions.ended_at", "is", null) // finished sessions only
    .order("name")
    .order("started_at", { referencedTable: "sessions", ascending: false })
    .limit(50, { referencedTable: "sessions" }); // most recent 50 per course

  return <SessionList courses={(data ?? []) as unknown as CourseWithSessions[]} />;
}

export default function AnalyticsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Courses</h2>
        <CourseForm />
        <Suspense fallback={<p className="text-muted-foreground">Loading courses...</p>}>
          <Courses />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Study time by course</h2>
        <Suspense fallback={<p className="text-muted-foreground">Loading chart...</p>}>
          <StudyBreakdown />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Sessions</h2>
        <Suspense fallback={<p className="text-muted-foreground">Loading sessions...</p>}>
          <Sessions />
        </Suspense>
      </section>
    </div>
  );
}