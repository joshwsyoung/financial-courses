import { SettingsForm } from "@/components/SettingsForm";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <SettingsForm />
    </div>
  );
}
