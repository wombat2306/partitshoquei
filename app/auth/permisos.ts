import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol =
  | "admin"
  | "padre"
  | "entrenador"
  | "delegado";

export async function obtenerUsuarioConRoles() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/socios");
  }

  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("id,nombre,apellidos")
    .eq("id", user.id)
    .maybeSingle();

  const { data: rolesData } = await supabase
    .from("usuario_rol")
    .select("rol")
    .eq("usuario_id", user.id);

  const roles = (rolesData ?? [])
    .map((item) => item.rol?.toLowerCase().trim())
    .filter(Boolean) as Rol[];

  return {
    supabase,
    user,
    perfil,
    roles,
  };
}

export async function exigirPerfil() {
  const datos = await obtenerUsuarioConRoles();

  if (!datos.perfil) {
    redirect("/socios");
  }

  return datos;
}

export async function exigirRol(rolesPermitidos: Rol[]) {
  const datos = await exigirPerfil();

  const esAdministrador = datos.roles.includes("admin");

  const tienePermiso = esAdministrador ||
    datos.roles.some((rol) => rolesPermitidos.includes(rol));

  if (!tienePermiso) {
    redirect("/socios");
  }

  return datos;
}

export async function exigirAdministrador() {
  return exigirRol(["admin"]);
}
