import { getAllSources } from "@/lib/content";
import { REPO_URL, SITE_NAME } from "@/lib/site";

export const metadata = { title: "About and licences" };

export default function AboutPage() {
  const sources = getAllSources();
  return (
    <div className="prose mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">About and licences</h1>
      <p>
        {SITE_NAME} is a free, open source, self-paced course. Its first syllabus is the CFA UK Level 4 Certificate in Investment Management (IMC).
        Learning, practice and AI mock papers are free. Getting certified is not: see <a href="/costs/">What you pay for</a>.
      </p>
      <h2>Not affiliated</h2>
      <p>
        This project is not affiliated with, endorsed by or connected to CFA UK, CFA Institute or Pearson VUE. &ldquo;IMC&rdquo; and &ldquo;CFA&rdquo; are used
        only to describe the exam this course prepares for. We use no logos. Only CFA UK can award the IMC.
      </p>
      <h2>Original content only</h2>
      <p>
        Everything here is written in our own words to teach the published learning outcomes. We do not copy the Official Training Manual,
        official mock papers, live exam questions or other prep providers&rsquo; material.
      </p>
      <h2>How content is made and checked</h2>
      <p>
        Some content is drafted with AI help. Anything not yet signed off by a qualified reviewer is labelled &ldquo;awaiting expert review&rdquo;.
        Maths answers are recomputed automatically, and tax content is tied to a specific tax year. Every question has a &ldquo;Report an error&rdquo; link.
      </p>
      <h2>Licences</h2>
      <ul>
        <li>Code: <a href={`${REPO_URL}/blob/main/LICENSE`}>MIT</a>.</li>
        <li>Course content: <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</li>
        <li>Facts from gov.uk, HMRC and legislation.gov.uk are used under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">Open Government Licence v3.0</a>.</li>
      </ul>
      <h2>Sources cited</h2>
      <ul>
        {sources.map((s) => (
          <li key={s}>{s.startsWith("http") ? <a href={s}>{s}</a> : s}</li>
        ))}
      </ul>
      <h2>Privacy</h2>
      <p>No tracking. Your progress is stored only in your browser unless you export it.</p>
      <h2>Takedown requests</h2>
      <p>
        If you hold rights in material you believe appears here, please <a href={`${REPO_URL}/blob/main/TAKEDOWN.md`}>follow our takedown process</a>. We act quickly.
      </p>
    </div>
  );
}
