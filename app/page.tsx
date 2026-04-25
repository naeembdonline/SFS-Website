import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config";

// Middleware handles root redirect, but this is a safety fallback.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
