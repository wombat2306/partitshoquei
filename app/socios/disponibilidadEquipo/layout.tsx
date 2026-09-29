import { exigirRol } from "@/app/auth/permisos";

export default async function DisponibilidadEquipoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirRol(["entrenador", "delegado"]);

  return children;
}
