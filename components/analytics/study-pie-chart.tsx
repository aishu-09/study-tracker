"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatHM } from "@/lib/time";

export type CourseStudy = {
  course_id: string;
  name: string;
  study_seconds: number;
};

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#ec4899",
];

export function StudyPieChart({ data }: { data: CourseStudy[] }) {
  const totalSeconds = data.reduce((n, d) => n + d.study_seconds, 0);

  if (totalSeconds === 0) {
    return (
      <p className="text-muted-foreground">
        No study time yet. Finish a session and it will show up here.
      </p>
    );
  }

  const slices = data.map((d, i) => ({
    ...d,
    color: COLORS[i % COLORS.length],
    percent: (d.study_seconds / totalSeconds) * 100,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="study_seconds"
              nameKey="name"
              innerRadius="55%"
              outerRadius="90%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.course_id} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.course_id} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatHM(s.study_seconds * 1000)}
            </span>
            <span className="w-14 text-right font-mono tabular-nums">
              {s.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Total study time:{" "}
        <span className="font-mono tabular-nums">{formatHM(totalSeconds * 1000)}</span>
      </p>
    </div>
  );
}