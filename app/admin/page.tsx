import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: jugadoresCount },
    { count: usuariosCount },
    { count: equiposCount },
    { data: padresData },
  ] = await Promise.all([
    supabase
      .from("jugadores")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("perfil_usuario")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("equipo")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("padre_jugador")
      .select("usuario_id"),
  ]);

  const padresCount = new Set(
    (padresData ?? []).map((padre) => padre.usuario_id)
  ).size;

  const tarjetas = [
    {
      titulo: "Jugadores",
      descripcion: "Gestiona jugadores, tutores y equipos.",
      contador: jugadoresCount ?? 0,
      href: "/admin/jugadores",
      icono: "👤",
    },
    {
      titulo: "Usuarios",
      descripcion: "Gestiona usuarios, roles y equipos.",
      contador: usuariosCount ?? 0,
      href: "/admin/usuarios",
      icono: "👥",
    },
    {
      titulo: "Equipos / fases",
      descripcion: "Gestiona equipos, fases y temporadas.",
      contador: equiposCount ?? 0,
      href: "/admin/equipos",
      icono: "🏆",
    },
    {
      titulo: "Padres / tutores",
      descripcion: "Consulta los jugadores vinculados.",
      contador: padresCount,
      href: "/admin/padres",
      icono: "👨‍👩‍👧",
    },
    {
      titulo: "Cuotas",
      descripcion: "Gestiona las cuotas de los jugadores.",
      href: "/admin/cuotas",
      icono: "💳",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/socios"
          className="
            mb-4
            inline-flex
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
          "
        >
          ← Volver a zona de socios
        </Link>

        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Administración
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestiona jugadores, usuarios, equipos y tutores.
          </p>
        </div>

        <div className="space-y-3">
          {tarjetas.map((tarjeta) => (
            <Link
              key={tarjeta.href}
              href={tarjeta.href}
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
                {tarjeta.icono}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  {tarjeta.titulo}
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  {tarjeta.descripcion}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {"contador" in tarjeta && (
                  <span
                    className="
                      rounded-full
                      bg-gray-100
                      px-2.5
                      py-1
                      text-xs
                      font-bold
                      text-gray-600
                    "
                  >
                    {tarjeta.contador}
                  </span>
                )}

                <span
                  className="
                    text-lg
                    text-gray-400
                    transition
                    group-hover:translate-x-1
                    group-hover:text-blue-600
                  "
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
