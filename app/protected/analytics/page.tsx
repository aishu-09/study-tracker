import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/analytics/course-form";
import { CourseList } from "@/components/analytics/course-list";

async function Courses() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("archived", false)
    .order("name");

  return <CourseList courses={courses ?? []} />;
}

export default function AnalyticsPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Courses</h2>
        <CourseForm />
        <Suspense
          fallback={<p className="text-muted-foreground">Loading courses...</p>}
        >
          <Courses />
        </Suspense>
      </section>
    </div>
  );
}