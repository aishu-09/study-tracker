import { LocalDate } from "@/components/local-date";
import { formatHM, sumSegments, type Segment } from "@/lib/time";

export type CourseWithSessions = {
  id: string;
  name: string;
  archived: boolean;
  sessions: {
    id: string;
    started_at: string;
    ended_at: string | null;
    session_segments: Segment[];
  }[];
};

export function SessionList({ courses }: { courses: CourseWithSessions[] }) {
  // Hide archived courses that never had a session
  const visible = courses.filter((c) => !c.archived || c.sessions.length > 0);

  if (visible.length === 0) {
    return <p className="text-muted-foreground">Add a course to start tracking sessions.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((course) => {
        const sessions = course.sessions.map((s) => {
          // Ended sessions have no open segments, so the end time is only a safe fallback
          const end = new Date(s.ended_at ?? s.started_at).getTime();
          const studyMs = sumSegments(s.session_segments, "study", end);
          const breakMs = sumSegments(s.session_segments, "break", end);
          return {
            id: s.id,
            startedAt: new Date(s.started_at).getTime(),
            studyMs,
            breakMs,
          };
        });

        const totalStudy = sessions.reduce((n, s) => n + s.studyMs, 0);
        const totalBreak = sessions.reduce((n, s) => n + s.breakMs, 0);

        return (
          <details key={course.id} className="group rounded-md border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-3">
              <div className="flex flex-col">
                <span className="font-medium">
                  {course.name}
                  {course.archived && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (archived)
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              <div className="text-right text-sm">
                <div className="font-mono tabular-nums">{formatHM(totalStudy)} study</div>
                <div className="font-mono tabular-nums text-muted-foreground">
                  {formatHM(totalBreak)} break
                </div>
              </div>
            </summary>

            <div className="border-t p-3">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet.</p>
              ) : (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-right text-muted-foreground">Study</span>
                  <span className="text-right text-muted-foreground">Break</span>
                  <span className="text-right text-muted-foreground">Total</span>
                  {sessions.map((s) => (
                    <div key={s.id} className="contents">
                      <span>
                        <LocalDate ms={s.startedAt} />
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {formatHM(s.studyMs)}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {formatHM(s.breakMs)}
                      </span>
                      <span className="text-right font-mono tabular-nums">
                        {formatHM(s.studyMs + s.breakMs)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}