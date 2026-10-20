import type { ExamInfo } from "@ofc/content";
import { formatDate } from "@/lib/content";

const FREE = [
  "Learning content for every syllabus topic",
  "Practice questions, module tests and stage tests",
  "AI-generated mock papers (clearly labelled as unofficial)",
  "Links to the free official CFA UK mock papers",
];

/** Spec 8.2: plain language, no dark patterns. All figures come from exam-info.yml. */
export function PayPanel({ info, compact = false }: { info: ExamInfo; compact?: boolean }) {
  const gbp = (n: number | null) => (n === null ? "Price TBC" : `£${n.toLocaleString("en-GB")}`);
  return (
    <div className="space-y-5">
      {!compact && (
        <p className="text-lg text-muted">
          Learning here is free, for good. Getting the qualification is not, and that money goes to CFA UK, not to us. Here is exactly what costs what.
        </p>
      )}
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-good/40 bg-good-soft p-4">
          <h3 className="font-semibold text-good">Free here</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2"><span aria-hidden>✓</span>{f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold">Not free (and not us)</h3>
          <table className="mt-2 w-full text-sm">
            <caption className="sr-only">Costs you pay to other organisations</caption>
            <tbody>
              {info.fees.map((f) => (
                <tr key={f.item} className="border-t border-border first:border-0 align-top">
                  <th scope="row" className="py-1.5 pr-3 text-left font-medium">{f.item}</th>
                  <td className="py-1.5 text-right whitespace-nowrap font-semibold">{gbp(f.amount_gbp)}</td>
                  <td className="py-1.5 pl-3 text-muted">{f.note}</td>
                </tr>
              ))}
              <tr className="border-t border-border align-top">
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">Exam delivery</th>
                <td className="py-1.5 text-right">—</td>
                <td className="py-1.5 pl-3 text-muted">{info.delivery}</td>
              </tr>
              <tr className="border-t border-border align-top">
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">Photo ID on exam day</th>
                <td className="py-1.5 text-right">£0</td>
                <td className="py-1.5 pl-3 text-muted">Free if you already hold valid photo ID.</td>
              </tr>
              <tr className="border-t border-border align-top">
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">Membership or tuition</th>
                <td className="py-1.5 text-right">Optional</td>
                <td className="py-1.5 pl-3 text-muted">CFA UK membership and tuition providers are not required to sit the exam.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <ul className="space-y-1 text-sm text-muted">
        <li><strong className="text-fg">{info.disclaimer}</strong></li>
        <li>Exemptions may exist. Check with CFA UK.</li>
        <li>No affiliate links. No sponsored placements.</li>
        <li>
          Last verified {formatDate(info.last_verified)} from{" "}
          {info.sources.map((s, i) => (
            <a key={s} href={s} className="underline" rel="noopener noreferrer">{i ? ", " : ""}{new URL(s).hostname}</a>
          ))}
          . Always check current fees before booking.
        </li>
      </ul>
    </div>
  );
}
