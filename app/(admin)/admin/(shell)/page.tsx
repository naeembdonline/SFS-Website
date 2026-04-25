import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenText,
  FolderOpen,
  Gavel,
  Inbox,
  Megaphone,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { getDashboardStats } from "@/lib/data/admin/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const stats = await getDashboardStats();
  const greeting = getGreeting();

  const CARDS: {
    label: string;
    href: string;
    desc: string;
    stat: number;
    icon: LucideIcon;
    tone: string;
    accent: string;
  }[] = [
    {
      label: "Blog posts",
      href: "/admin/posts?type=blog",
      desc: "Write and publish blog articles",
      stat: stats.postCount,
      icon: PenLine,
      tone: "border-sky-500 bg-sky-50 text-sky-700",
      accent: "bg-sky-500",
    },
    {
      label: "News",
      href: "/admin/posts?type=news",
      desc: "Publish news updates",
      stat: stats.postCount,
      icon: Megaphone,
      tone: "border-[#D4AF37] bg-[#D4AF37]/10 text-[#9A7A18]",
      accent: "bg-[#D4AF37]",
    },
    {
      label: "Campaigns",
      href: "/admin/campaigns",
      desc: "Manage active campaigns",
      stat: stats.campaignCount,
      icon: BookOpenText,
      tone: "border-emerald-500 bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
    },
    {
      label: "Resources",
      href: "/admin/resources",
      desc: "Upload documents and links",
      stat: 0,
      icon: FolderOpen,
      tone: "border-violet-500 bg-violet-50 text-violet-700",
      accent: "bg-violet-500",
    },
    {
      label: "Leadership",
      href: "/admin/leadership",
      desc: "Edit committee members",
      stat: 0,
      icon: Gavel,
      tone: "border-amber-500 bg-amber-50 text-amber-700",
      accent: "bg-amber-500",
    },
    {
      label: "Submissions",
      href: "/admin/submissions",
      desc: "Review contact form submissions",
      stat: stats.pendingSubmissions,
      icon: Inbox,
      tone: "border-rose-500 bg-rose-50 text-rose-700",
      accent: "bg-rose-500",
    },
  ];

  return (
    <div className="font-sans">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Admin Dashboard
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            {greeting}, Admin
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Monitor editorial activity, manage content operations, and keep the
            public site moving with confidence.
          </p>
        </div>
        {/* Total posts stat */}
        <div className="rounded-xl border border-[#D4AF37]/30 bg-white px-6 py-4 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Total posts
          </p>
          <p className="mt-1 text-3xl font-bold text-[#0B3D2E]">
            {stats.postCount}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <DashboardCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
}

function DashboardCard({
  label,
  href,
  desc,
  stat,
  icon: Icon,
  tone,
  accent,
}: {
  label: string;
  href: string;
  desc: string;
  stat: number;
  icon: LucideIcon;
  tone: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0B3D2E]/20 hover:shadow-xl hover:shadow-[#0B3D2E]/8"
    >
      <div className={`absolute inset-y-0 start-0 w-1.5 ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-4xl font-bold tracking-tight text-[#0B3D2E]">
          {stat}
        </span>
      </div>
      <div className="mt-6">
        <p className="text-base font-semibold text-neutral-950 transition-colors group-hover:text-[#0B3D2E]">
          {label}
        </p>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{desc}</p>
      </div>
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
