import type { Metadata } from "next";
import { fontBn, fontEn, fontAr } from "@/lib/fonts";
import { Analytics } from "@/components/public/analytics";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    template: "%s | Sovereignty",
    default: "Sovereignty",
  },
};

/**
 * Root layout — sets font variables on <html>.
 * lang/dir are NOT set here: they would require reading request headers which
 * is uncached dynamic data incompatible with cacheComponents without Suspense.
 *
 * Instead, each locale layout wraps its content in a <div lang dir="..."> so
 * that CSS :lang() selectors and logical properties (ms-*, me-*) work correctly.
 * The root lang defaults to "bn" for browsers that read it before JS runs.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${fontEn.variable} ${fontBn.variable} ${fontAr.variable}`}
    >
      <body
        className="min-h-svh antialiased"
        style={{ backgroundColor: "var(--color-bg-page)", color: "var(--color-text-primary)" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
