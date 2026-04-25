"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  FileText,
  FolderOpen,
  Gavel,
  Home,
  Image,
  Inbox,
  LayoutList,
  Megaphone,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItemConfig = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact: boolean;
};

const NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: BarChart3,
    exact: true,
  },
  {
    label: "Posts",
    href: "/admin/posts",
    icon: BookOpenText,
    exact: false,
  },
  {
    label: "Campaigns",
    href: "/admin/campaigns",
    icon: Megaphone,
    exact: false,
  },
  {
    label: "Resources",
    href: "/admin/resources",
    icon: FolderOpen,
    exact: false,
  },
  {
    label: "Leadership",
    href: "/admin/leadership",
    icon: Gavel,
    exact: false,
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: FileText,
    exact: false,
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: Image,
    exact: false,
  },
  {
    label: "Submissions",
    href: "/admin/submissions",
    icon: Inbox,
    exact: false,
  },
] as const satisfies NavItemConfig[];

const ADMIN_ONLY_ITEMS = [
  { label: "Navigation", href: "/admin/navigation", icon: LayoutList, exact: false },
  { label: "Settings", href: "/admin/settings", icon: Settings, exact: false },
  { label: "Users", href: "/admin/users", icon: Users, exact: false },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText, exact: false },
] as const satisfies NavItemConfig[];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: "admin" | "editor";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 start-0 z-30 flex w-72 flex-col border-e border-[#06281E] bg-[#0B3D2E] font-sans text-white shadow-2xl shadow-[#071A14]/20">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-6">
        <Link
          href="/admin"
          className="group flex items-center gap-3 text-white"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37] shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">Sovereignty</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D4AF37]">
              Admin Console
            </span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href, item.exact)}
          />
        ))}

        {role === "admin" && (
          <>
            <div className="my-5 border-t border-white/10" />
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Administration
            </p>
            {ADMIN_ONLY_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={isActive(item.href, item.exact)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <Link
          href="/admin/account/password"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition-all duration-200 hover:border-[#D4AF37]/40 hover:bg-white/[0.08] hover:text-white"
        >
          <Home className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          Account settings
        </Link>
      </div>
    </aside>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
        active
          ? "bg-white/12 text-white shadow-inner ring-1 ring-[#D4AF37]/25"
          : "text-white/80 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200",
          active
            ? "bg-[#D4AF37]/18 text-[#D4AF37]"
            : "bg-white/[0.06] text-white/70 group-hover:text-[#D4AF37]"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {label}
    </Link>
  );
}
