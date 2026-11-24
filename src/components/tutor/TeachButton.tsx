"use client";
import { Button } from "../ui";
import { ISparkle } from "../icons";
import { setTutorOpen, useTutorOpenFor } from "@/lib/tutor-store";

/** Sits in the result card after a question is checked. Opens the tutor tray for that question. */
export function TeachButton({ qid }: { qid: string }) {
  const open = useTutorOpenFor() === qid;
  return (
    <Button type="button" variant="secondary" size="sm" aria-expanded={open} onClick={() => setTutorOpen(open ? null : qid)}>
      <ISparkle className="h-4 w-4" /> {open ? "Close tutor" : "Teach me this"}
    </Button>
  );
}
