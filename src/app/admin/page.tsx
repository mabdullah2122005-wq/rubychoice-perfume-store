import { getDashboardData } from "@/lib/admin-dashboard";
import AdminDashboardView from "@/components/admin/AdminDashboardView";

export const metadata = { title: "Dashboard — Admin" };

export default async function AdminDashboard() {
  const data = await getDashboardData();
  return <AdminDashboardView data={data} />;
}
