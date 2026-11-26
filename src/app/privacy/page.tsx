import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy">
      <p>ScholarSAT collects only what it needs to run your account.</p>
      <h2>What we store</h2>
      <p>Your name, email address, a securely hashed password, your answers, saved questions, test results, and the optional goal and test date you enter in Settings.</p>
      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell your data, run advertising, or use third-party tracking scripts. A session cookie keeps you logged in.</p>
      <h2>Optional AI tutor</h2>
      <p>The local model processes exercises on this computer. If you choose a ChatGPT plan or an OpenAI key in the tutor, ScholarSAT sends the exercise to OpenAI. API keys stay in tab memory and pass through the server for that request. The local ChatGPT connection uses a separate HTTP-only cookie. Its credentials stay in server memory for this session. Disconnect from the tutor or manage access in ChatGPT settings. For Other AI providers and annotated lessons, the browser sends the exercise and follow-ups directly to your selected provider using the key saved in that browser.</p>
      <h2>Deleting your data</h2>
      <p>You can reset your progress or permanently delete your account at any time from Settings. Deletion removes your account and all associated data.</p>
      <h2>Open source</h2>
      <p>ScholarSAT&apos;s code is public, so you can verify exactly how your data is handled.</p>
    </LegalPage>
  );
}
