import { AccountPanel } from "@/components/AccountPanel";

export const metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Your account</h1>
      <AccountPanel />
    </div>
  );
}
