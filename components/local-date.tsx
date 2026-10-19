"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function format(ms: number) {
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

// Renders in the viewer's timezone without a server/client hydration mismatch
export function LocalDate({ ms }: { ms: number }) {
  const text = useSyncExternalStore(subscribe, () => format(ms), () => "…");
  return <>{text}</>;
}