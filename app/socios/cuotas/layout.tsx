import { exigirRol } from "@/app/auth/permisos";

export default async function CuotasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirRol(["padre"]);

  return children;
}
