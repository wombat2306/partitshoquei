import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logoutButton";
import Link from "next/link";

export default async function SociosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/socios");
  }

  // Comprobamos si el usuario ya tiene perfil
  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("id,nombre,apellidos")
    .eq("id", user.id)
    .maybeSingle();

  // Si todavía no tiene perfil
  if (!perfil) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* CABECERA */}
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                🏑
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Zona de socios
                </h1>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {user.email}
                </p>
              </div>

            </div>
          </section>

          {/* PERFIL PENDIENTE */}
          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                👤
              </div>

              <div>
                <h2 className="text-sm font-semibold text-blue-900">
                  Cuenta creada correctamente
                </h2>

                <p className="mt-2 text-sm leading-6 font-medium text-blue-800">
                  ¡Estamos acabando de preparar tu perfil!
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  En breve podrás ver toda la información
                  disponible en la zona de socios.
                </p>
              </div>

            </div>

          </section>

          {/* CERRAR SESIÓN */}
          <div className="pt-1">
            <LogoutButton />
          </div>

        </div>
      </main>
    );
  }

  // Obtenemos los roles del usuario
  const { data: rolesData } = await supabase
    .from("usuario_rol")
    .select("rol")
    .eq("usuario_id", user.id);

  const roles = (rolesData ?? [])
    .map((item) => item.rol?.toLowerCase().trim())
    .filter(Boolean);

  const esAdministrador =
    roles.includes("administrador") ||
    roles.includes("admin");

  const esPadre =
    roles.includes("padre");

  const esEntrenador =
    roles.includes("entrenador");

  const esDelegado =
    roles.includes("delegado");

  const puedeVerCuotas =
    esAdministrador || esPadre;

  const puedeVerDisponibilidad =
    esAdministrador || esPadre;

  const puedeVerDisponibilidadEquipo =
    esAdministrador ||
    esEntrenador ||
    esDelegado;

  return (
  <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
    <div className="mx-auto max-w-2xl">

      {/* CABECERA */}
      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gray-50
                text-lg
              "
            >
              🏑
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">
                Zona de socios
              </p>

              <h1 className="truncate text-base font-bold text-gray-900">
                Hola, {perfil.nombre}
              </h1>

              <p className="truncate text-xs text-gray-500">
                {user.email}
              </p>
            </div>

          </div>

          <Link
            href="/socios/perfil"
            className="
              shrink-0
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-gray-700
              shadow-sm
              transition
              hover:bg-gray-50
            "
          >
            Mi perfil
          </Link>

        </div>
      </section>

      {/* MI ZONA */}
      {(puedeVerCuotas || puedeVerDisponibilidad) && (
        <>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Mi zona
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Gestiona la información de tus jugadores.
            </p>
          </div>

          <div className="mb-5 space-y-3">

            {/* CUOTAS */}
            {puedeVerCuotas && (
              <Link
                href="/socios/cuotas"
                className="
                  group
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  bg-white
                  px-4
                  py-3
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gray-50
                    text-lg
                  "
                >
                  💳
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900">
                    Mis cuotas
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Consulta las cuotas y comunica los pagos.
                  </p>
                </div>

                <span
                  className="
                    shrink-0
                    text-lg
                    text-gray-400
                    transition
                    group-hover:translate-x-1
                    group-hover:text-blue-600
                  "
                >
                  →
                </span>
              </Link>
            )}

            {/* DISPONIBILIDAD */}
            {puedeVerDisponibilidad && (
              <Link
                href="/socios/disponibilidad"
                className="
                  group
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  bg-white
                  px-4
                  py-3
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gray-50
                    text-lg
                  "
                >
                  📅
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900">
                    Disponibilidad
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Indica cuándo pueden jugar tus jugadores.
                  </p>
                </div>

                <span
                  className="
                    shrink-0
                    text-lg
                    text-gray-400
                    transition
                    group-hover:translate-x-1
                    group-hover:text-blue-600
                  "
                >
                  →
                </span>
              </Link>
            )}

          </div>
        </>
      )}

      {/* GESTIÓN DEPORTIVA */}
      {puedeVerDisponibilidadEquipo && (
        <>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Gestión deportiva
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Consulta la disponibilidad de tus equipos.
            </p>
          </div>

          <div className="mb-5">
            <Link
              href="/socios/disponibilidadEquipo"
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                bg-white
                px-4
                py-3
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gray-50
                  text-lg
                "
              >
                🏑
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  Disponibilidad por equipo
                </h3>

                <p className="mt-0.5 text-xs text-gray-500">
                  Consulta jugadores, partidos y necesidades del equipo.
                </p>
              </div>

              <span
                className="
                  shrink-0
                  text-lg
                  text-gray-400
                  transition
                  group-hover:translate-x-1
                  group-hover:text-blue-600
                "
              >
                →
              </span>
            </Link>
          </div>
        </>
      )}

      {/* ADMINISTRACIÓN */}
      {esAdministrador && (
        <>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-gray-900">
              Administración
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Herramientas de gestión del club.
            </p>
          </div>

          <div className="mb-5">
            <Link
              href="/admin"
              className="
                group
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-purple-100
                bg-purple-50
                px-4
                py-3
                transition
                hover:-translate-y-0.5
                hover:bg-purple-100
                hover:shadow-md
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-lg
                "
              >
                ⚙️
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-purple-900">
                  Panel de administración
                </h3>

                <p className="mt-0.5 text-xs text-purple-700">
                  Gestiona usuarios, jugadores, equipos y cuotas.
                </p>
              </div>

              <span
                className="
                  shrink-0
                  text-lg
                  text-purple-300
                  transition
                  group-hover:translate-x-1
                  group-hover:text-purple-600
                "
              >
                →
              </span>
            </Link>
          </div>
        </>
      )}

      {/* SIN ACCESOS */}
      {!esAdministrador &&
        !esPadre &&
        !esEntrenador &&
        !esDelegado && (
          <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-lg
                "
              >
                ℹ️
              </div>

              <div>
                <h2 className="text-sm font-semibold text-blue-900">
                  Cuenta configurada
                </h2>

                <p className="mt-1 text-sm leading-5 font-medium text-blue-800">
                  ¡Estamos acabando de preparar tu perfil!
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  En breve podrás ver toda la información disponible
                  en la zona de socios.
                </p>
              </div>

            </div>
          </section>
        )}

      {/* CERRAR SESIÓN */}
      <div className="pt-1">
        <LogoutButton />
      </div>

    </div>
  </main>
);
}
