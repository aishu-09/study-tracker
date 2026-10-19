"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Course = { id: string; name: string };

export function Timer({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState("");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="font-mono text-7xl tabular-nums">00:00:00</div>

      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className="h-9 w-64 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">Select a course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {courses.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No courses yet.{" "}
          <Link href="/protected/analytics" className="underline">
            Add one on the Analytics page
          </Link>
          .
        </p>
      )}

      <Button disabled={!courseId}>Start</Button>
    </div>
  );
}