import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Settings" };

export default function AccountPasswordPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Account Settings</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Password change — coming in a future phase.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
        <p className="text-sm text-neutral-400">Not yet implemented.</p>
      </div>
    </div>
  );
}
