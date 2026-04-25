"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import { LanguageSwitcher } from "./language-switcher";

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  locale: Locale;
  dict: Dictionary;
  navItems: NavItem[];
}

export function MobileMenu({ locale, dict, navItems }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label={dict.nav.openMenu}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="flex h-11 w-11 items-center justify-center rounded-md text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green md:hidden"
      >
        <MenuIcon />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-brand-black"
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={dict.nav.openMenu}
          ref={menuRef}
        >
          <div className="flex h-full flex-col px-4 pb-8 pt-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Sovereignty</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={dict.nav.closeMenu}
                className="flex h-11 w-11 items-center justify-center rounded-md text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Nav links */}
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-lg font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Language switcher */}
            <div className="mt-auto pt-8 border-t border-white/10">
              <LanguageSwitcher currentLocale={locale} dict={dict} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
