import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — ShipWeek Growth OS",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const overview = await getAdminOverview();
  return <AdminDashboard overview={overview} />;
}
