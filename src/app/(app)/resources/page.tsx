import type { Metadata } from "next";
import { Card, PageTitle } from "@/components/ui";
import { IArrowR } from "@/components/icons";

export const metadata: Metadata = { title: "Official Resources" };

const LINKS = [
  { title: "Bluebook full-length practice tests", desc: "College Board's official adaptive practice tests, in the same app used on test day.", href: "https://bluebook.collegeboard.org/" },
  { title: "SAT Suite Question Bank", desc: "College Board's free official question bank, filterable by domain, skill, and difficulty.", href: "https://satsuitequestionbank.collegeboard.org/" },
  { title: "Paper practice tests (PDF)", desc: "Printable linear versions of the official practice tests, with answer explanations.", href: "https://satsuite.collegeboard.org/practice/practice-tests/paper" },
  { title: "Official SAT Practice on Khan Academy", desc: "Free lessons and practice built in partnership with College Board.", href: "https://www.khanacademy.org/test-prep/digital-sat" },
  { title: "Register for the SAT", desc: "Test dates, registration deadlines, and fee waivers.", href: "https://satsuite.collegeboard.org/sat/registration" },
  { title: "Desmos graphing calculator", desc: "The same calculator built into the digital SAT. Practice with it before test day.", href: "https://www.desmos.com/calculator" },
];

export default function Resources() {
  return (
    <>
      <PageTitle title="Official Resources" sub="ScholarSAT's questions are original. Pair them with these free official materials." />
      <div className="grid gap-4 md:grid-cols-2">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="group">
            <Card className="h-full transition-colors group-hover:border-red/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold group-hover:text-red">{l.title}</h2>
                  <p className="mt-1 text-sm text-muted">{l.desc}</p>
                </div>
                <IArrowR className="mt-1 h-5 w-5 shrink-0 text-muted group-hover:text-red" />
              </div>
            </Card>
          </a>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted">SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ScholarSAT.</p>
    </>
  );
}
