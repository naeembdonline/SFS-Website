import type { Metadata } from "next";
import { getAdminSiteSettings } from "@/lib/data/admin/settings";
import { SiteSettingsForm } from "@/components/admin/settings/site-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getAdminSiteSettings();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Site Settings</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Singleton settings row (id=1).</p>
      </div>
      <SiteSettingsForm settings={settings} />
    </div>
  );
}
