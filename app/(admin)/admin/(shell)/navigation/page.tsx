import type { Metadata } from "next";
import { getAdminNavItems } from "@/lib/data/admin/settings";
import { NavItemForm } from "@/components/admin/settings/nav-item-form";

export const metadata: Metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const items = await getAdminNavItems();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Navigation</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Flat structure only (no parent nesting).</p>
      </div>

      <NavItemForm />

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-900">
                {item.translations.bn.label || "(no BN label)"} · {item.menu}
              </p>
            </div>
            <NavItemForm item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
