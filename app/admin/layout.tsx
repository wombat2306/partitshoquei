import { exigirAdministrador } from "@/app/auth/permisos";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirAdministrador();

  return children;
}
