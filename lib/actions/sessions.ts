"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sumSegments, type Segment } from "@/lib/time";

type Fail = { ok: false; error: string };
type Ok = { ok: true };

const GENERIC_ERROR: Fail = { ok: false, error: "Something went wrong. Try again." };

export async function startSession(courseId: string): Promise<Ok | Fail> {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ course_id: courseId })
    .select("id")
    .single();

  if (error) {
    // 23505 = the one-active-session-per-user index
    if (error.code === "23505") {
      return { ok: false, error: "You already have a session in progress." };
    }
    return GENERIC_ERROR;
  }

  const { error: segError } = await supabase
    .from("session_segments")
    .insert({ session_id: session.id, kind: "study" });

  if (segError) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return GENERIC_ERROR;
  }

  revalidatePath("/protected", "layout");
  return { ok: true };
}

// Close the open segment of kind `from`, then open one of kind `to`.
async function switchSegment(
  sessionId: string,
  from: Segment["kind"],
  to: Segment["kind"],
): Promise<Ok | Fail> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: closed, error } = await supabase
    .from("session_segments")
    .update({ ended_at: now })
    .eq("session_id", sessionId)
    .eq("kind", from)
    .is("ended_at", null)
    .select("id");

  if (error) return GENERIC_ERROR;
  // Nothing was open: already switched (double click, or another tab)
  if (!closed || closed.length === 0) return { ok: true };

  const { error: insertError } = await supabase
    .from("session_segments")
    .insert({ session_id: sessionId, kind: to, started_at: now });

  if (insertError) return GENERIC_ERROR;

  revalidatePath("/protected", "layout");
  return { ok: true };
}

export async function pauseSession(sessionId: string) {
  return switchSegment(sessionId, "study", "break");
}

export async function resumeSession(sessionId: string) {
  return switchSegment(sessionId, "break", "study");
}

export async function endSession(
  sessionId: string,
): Promise<Fail | { ok: true; studyMs: number; breakMs: number }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: segError } = await supabase
    .from("session_segments")
    .update({ ended_at: now })
    .eq("session_id", sessionId)
    .is("ended_at", null);
  if (segError) return GENERIC_ERROR;

  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ ended_at: now })
    .eq("id", sessionId)
    .is("ended_at", null);
  if (sessionError) return GENERIC_ERROR;

  const { data } = await supabase
    .from("session_segments")
    .select("kind, started_at, ended_at")
    .eq("session_id", sessionId);

  const segments = (data ?? []) as Segment[];
  revalidatePath("/protected", "layout");

  return {
    ok: true,
    studyMs: sumSegments(segments, "study", Date.now()),
    breakMs: sumSegments(segments, "break", Date.now()),
  };
}

export async function heartbeatSession(sessionId: string): Promise<Ok | Fail> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", sessionId)
      .is("ended_at", null)
      .select("id");
  
    if (error) return GENERIC_ERROR;
    if (!data || data.length === 0) {
      return { ok: false, error: "That session has already ended." };
    }
    // No revalidatePath on purpose: this runs every minute and shouldn't refetch the page
    return { ok: true };
  }
  
  // End a session at its last sign of life instead of "now"
  export async function endStaleSession(
    sessionId: string,
  ): Promise<Fail | { ok: true; studyMs: number; breakMs: number }> {
    const supabase = await createClient();
  
    const { data: session } = await supabase
      .from("sessions")
      .select("last_active_at")
      .eq("id", sessionId)
      .is("ended_at", null)
      .maybeSingle();
    if (!session) return { ok: false, error: "That session has already ended." };
  
    const { data } = await supabase
      .from("session_segments")
      .select("kind, started_at, ended_at")
      .eq("session_id", sessionId);
    const segments = (data ?? []) as Segment[];
  
    // End at the last ping, but never before the newest segment began
    const cutoffMs = Math.max(
      new Date(session.last_active_at).getTime(),
      ...segments.map((s) => new Date(s.started_at).getTime()),
    );
    const cutoff = new Date(cutoffMs).toISOString();
  
    const { error: segError } = await supabase
      .from("session_segments")
      .update({ ended_at: cutoff })
      .eq("session_id", sessionId)
      .is("ended_at", null);
    if (segError) return GENERIC_ERROR;
  
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({ ended_at: cutoff })
      .eq("id", sessionId)
      .is("ended_at", null);
    if (sessionError) return GENERIC_ERROR;
  
    const closed = segments.map((s) => ({ ...s, ended_at: s.ended_at ?? cutoff }));
    revalidatePath("/protected", "layout");
  
    return {
      ok: true,
      studyMs: sumSegments(closed, "study", cutoffMs),
      breakMs: sumSegments(closed, "break", cutoffMs),
    };
  }