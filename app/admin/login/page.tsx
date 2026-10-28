import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — ShipWeek Growth OS",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <header className="relative border-b border-line">
        <div className="shell flex h-[64px] items-center justify-between">
          <a href="/" className="flex items-baseline gap-2">
            <span className="display text-[28px] leading-none">ShipWeek</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Growth OS
            </span>
          </a>
          <a href="/" className="text-[11px] text-ink-soft hover:text-ink">← Back to the site</a>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 py-16">
        <AdminLoginForm />
      </main>

      <footer className="relative border-t border-line">
        <div className="shell py-4 text-[10px] text-ink-faint">
          Preview data is seeded and labelled. Do not present it as a real campaign result.
        </div>
      </footer>
    </div>
  );
}
