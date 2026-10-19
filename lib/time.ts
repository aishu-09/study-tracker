export const HEARTBEAT_MS = 60 * 1000; // how often the page pings while a session runs
export const STALE_MS = 20 * 60 * 1000; // how long without a ping before we ask

export type Segment = {
    kind: "study" | "break";
    started_at: string;
    ended_at: string | null;
  };
  
  // Sum the time spent in one kind of segment. An open segment counts up to `now`.
  export function sumSegments(segments: Segment[], kind: Segment["kind"], now: number) {
    return segments
      .filter((s) => s.kind === kind)
      .reduce((total, s) => {
        const end = s.ended_at ? new Date(s.ended_at).getTime() : now;
        return total + Math.max(0, end - new Date(s.started_at).getTime());
      }, 0);
  }
  
  export function formatDuration(ms: number) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }