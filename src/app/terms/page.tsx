import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>ScholarSAT is a free, open-source study tool provided as is, without warranties of any kind.</p>
      <h2>Using ScholarSAT</h2>
      <p>Use the site for personal study. Don&apos;t attempt to disrupt the service, access other people&apos;s accounts, or scrape it in a way that degrades it for others.</p>
      <h2>Scores</h2>
      <p>Predicted and mock-test scores are estimates based on ScholarSAT questions. They are not official scores and do not guarantee any result on the SAT.</p>
      <h2>Trademarks</h2>
      <p>SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ScholarSAT.</p>
      <h2>License</h2>
      <p>The ScholarSAT source code is released under the MIT License.</p>
    </LegalPage>
  );
}
