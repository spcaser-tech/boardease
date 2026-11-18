import { DashboardShell } from "@/components/dashboard/shell";
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="tenant">{children}</DashboardShell>;
}
