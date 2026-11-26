"use client";
import { Button } from "../ui";
import { ISparkle } from "../icons";
import { MissReason } from "../MissReason";
import { setTutorOpen, useTutorOpenFor } from "@/lib/tutor-store";

/**
 * Sits in the result card after a question is checked. Opens the tutor tray for that question. After a wrong
 * answer from a signed-in student it also asks, optionally, why it was missed.
 */
export function TeachButton({ qid, correct = true, saved = false }: { qid: string; correct?: boolean; saved?: boolean }) {
  const open = useTutorOpenFor() === qid;
  return (
    <div className="grid gap-3">
      {!correct && saved && <MissReason key={qid} qid={qid} />}
      <div className="flex">
        <Button type="button" variant="secondary" size="sm" aria-expanded={open} onClick={() => setTutorOpen(open ? null : qid)}>
          <ISparkle className="h-4 w-4" /> {open ? "Close tutor" : "Teach me this"}
        </Button>
      </div>
    </div>
  );
}
