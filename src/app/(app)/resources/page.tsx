import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { IArrowR, IBook, ICalc, IClock, IExam, IPlay, ITarget } from "@/components/icons";

export const metadata: Metadata = { title: "Official Resources" };

const LINKS = [
  { Icon: IExam, title: "Bluebook full-length practice tests", desc: "College Board's official adaptive practice tests, in the same app used on test day.", href: "https://bluebook.collegeboard.org/" },
  { Icon: IBook, title: "SAT Suite Question Bank", desc: "College Board's free official question bank, filterable by domain, skill, and difficulty.", href: "https://satsuitequestionbank.collegeboard.org/" },
  { Icon: IClock, title: "Paper practice tests (PDF)", desc: "Printable linear versions of the official practice tests, with answer explanations.", href: "https://satsuite.collegeboard.org/practice/practice-tests/paper" },
  { Icon: IPlay, title: "Official SAT Practice on Khan Academy", desc: "Free lessons and practice built in partnership with College Board.", href: "https://www.khanacademy.org/test-prep/digital-sat" },
  { Icon: ITarget, title: "Register for the SAT", desc: "Test dates, registration deadlines, and fee waivers.", href: "https://satsuite.collegeboard.org/sat/registration" },
  { Icon: ICalc, title: "Desmos graphing calculator", desc: "The same calculator built into the digital SAT. Practice with it before test day.", href: "https://www.desmos.com/calculator" },
];

export default function Resources() {
  return (
    <div className="animate-rise">
      <PageTitle title="Official Resources" sub="ScholarSAT's questions are original. Pair them with these free official materials." />
      <div className="grid gap-4 md:grid-cols-2">
        {LINKS.map(({ Icon, title, desc, href }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-red-200">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red"><Icon /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-medium group-hover:text-red">{title}</span>
              <span className="mt-1 block text-sm text-muted">{desc}</span>
            </span>
            <IArrowR className="mt-1 h-5 w-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-red" />
          </a>
        ))}
      </div>
      <p className="mt-8 text-xs text-muted">SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ScholarSAT.</p>
    </div>
  );
}
