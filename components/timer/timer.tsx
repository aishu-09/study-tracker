"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  endStaleSession,
  heartbeatSession,
} from "@/lib/actions/sessions";
import {
  formatDuration,
  sumSegments,
  HEARTBEAT_MS,
  STALE_MS,
  type Segment,
} from "@/lib/time";

type Course = { id: string; name: string };
export type ActiveSession = {
  id: string;
  courseName: string;
  lastActiveAt: number; // ms since epoch
  segments: Segment[];
};
type Summary = { courseName: string; studyMs: number; breakMs: number };
type ActionResult = Promise<{ ok: boolean; error?: string }>;

// Formats in the viewer's timezone without a server/client hydration mismatch
const subscribe = () => () => {};

function formatLocal(ms: number) {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function LocalTime({ ms }: { ms: number }) {
  const text = useSyncExternalStore(subscribe, () => formatLocal(ms), () => "…");
  return <>{text}</>;
}

export function Timer({
  courses,
  active,
  serverNow,
}: {
  courses: Course[];
  active: ActiveSession | null;
  serverNow: number;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [now, setNow] = useState(serverNow);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Set when we think the user left: which session, and when they were last seen
  const [stale, setStale] = useState<{ id: string; at: number } | null>(() =>
    active && serverNow - active.lastActiveAt > STALE_MS
      ? { id: active.id, at: active.lastActiveAt }
      : null,
  );
  const lastBeat = useRef(serverNow);

  const activeId = active?.id ?? null;
  const staleAt = active && stale?.id === active.id ? stale.at : null;
  const running = activeId !== null && staleAt === null;

  // While a session runs: tick the display, ping the database, watch for gaps
  useEffect(() => {
    if (!running || !activeId) return;
    const sessionId: string = activeId;
    lastBeat.current = Date.now();
    setNow(Date.now());

    function isStale() {
      if (Date.now() - lastBeat.current <= STALE_MS) return false;
      setStale({ id: sessionId, at: lastBeat.current });
      return true;
    }

    async function beat() {
      if (isStale()) return;
      try {
        const res = await heartbeatSession(sessionId);
        if (res.ok) lastBeat.current = Date.now();
        else router.refresh(); // session ended elsewhere; resync
      } catch {
        // offline: leave lastBeat alone, the gap check will catch a long outage
      }
    }

    beat();
    const tickId = setInterval(() => {
      if (!isStale()) setNow(Date.now());
    }, 500);
    const beatId = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(tickId);
      clearInterval(beatId);
    };
  }, [running, activeId, router]);

  const studyMs = active ? sumSegments(active.segments, "study", now) : 0;
  const breakMs = active ? sumSegments(active.segments, "break", now) : 0;
  const onBreak =
    active?.segments.some((s) => s.kind === "break" && s.ended_at === null) ?? false;

  function handle(action: () => ActionResult) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  function handleEnd() {
    if (!active) return;
    const { id, courseName } = active;
    setError(null);
    startTransition(async () => {
      const result = await endSession(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary({ courseName, studyMs: result.studyMs, breakMs: result.breakMs });
    });
  }

  function handleEndStale() {
    if (!active) return;
    const { id, courseName } = active;
    setError(null);
    startTransition(async () => {
      const result = await endStaleSession(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSummary({ courseName, studyMs: result.studyMs, breakMs: result.breakMs });
    });
  }

  function keepGoing() {
    if (!active) return;
    setError(null);
    startTransition(async () => {
      const result = await heartbeatSession(active.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      lastBeat.current = Date.now();
      setNow(Date.now());
      setStale(null);
    });
  }

  if (summary) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold">Session complete</h1>
        <p className="text-muted-foreground">{summary.courseName}</p>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono tabular-nums">
          <dt className="font-sans text-muted-foreground">Study</dt>
          <dd>{formatDuration(summary.studyMs)}</dd>
          <dt className="font-sans text-muted-foreground">Break</dt>
          <dd>{formatDuration(summary.breakMs)}</dd>
          <dt className="font-sans font-medium">Total</dt>
          <dd className="font-medium">
            {formatDuration(summary.studyMs + summary.breakMs)}
          </dd>
        </dl>
        <Button onClick={() => setSummary(null)}>New session</Button>
      </div>
    );
  }

  if (active && staleAt !== null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-2xl font-semibold">Still studying?</h1>
        <p className="max-w-md text-muted-foreground">
          Your <span className="font-medium text-foreground">{active.courseName}</span>{" "}
          session is still open, but we haven&apos;t seen any activity since{" "}
          <LocalTime ms={staleAt} />.
        </p>
        <div className="flex gap-2">
          <Button disabled={pending} onClick={handleEndStale}>
            End at <LocalTime ms={staleAt} />
          </Button>
          <Button variant="outline" disabled={pending} onClick={keepGoing}>
            Keep going
          </Button>
        </div>
        <p className="max-w-md text-xs text-muted-foreground">
          Keep going counts all the time since then as part of this session.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="font-mono text-7xl tabular-nums">{formatDuration(studyMs)}</div>

      {active ? (
        <>
          <div className="flex flex-col items-center gap-1">
            <p className="font-medium">{active.courseName}</p>
            <p className="text-sm text-muted-foreground">
              {onBreak ? "On break" : "Studying"} · break time{" "}
              <span className="font-mono tabular-nums">{formatDuration(breakMs)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {onBreak ? (
              <Button disabled={pending} onClick={() => handle(() => resumeSession(active.id))}>
                Resume
              </Button>
            ) : (
              <Button disabled={pending} onClick={() => handle(() => pauseSession(active.id))}>
                Pause
              </Button>
            )}
            <Button variant="outline" disabled={pending} onClick={handleEnd}>
              End session
            </Button>
          </div>
        </>
      ) : (
        <>
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

          <Button
            disabled={!courseId || pending}
            onClick={() => handle(() => startSession(courseId))}
          >
            Start
          </Button>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}