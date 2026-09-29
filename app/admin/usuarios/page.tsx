"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
};

type Rol = {
  usuario_id: string;
  rol: string;
};

type EquipoFase = {
  id: number;
  fase: number | null;
  equipo: {
    id: number;
    nombre: string;
  } | null;
};

type UsuarioEquipoFase = {
  usuario_id: string;
  equipo_fase_id: number;
  equipo_fase: EquipoFase | null;
};

type PadreJugador = {
  usuario_id: string;
  jugador_id: number;
};

type UsuarioCompleto = Usuario & {
  roles: string[];
  equiposFases: EquipoFase[];
  jugadoresTutor: number;
};

export default function UsuariosAdminPage() {
  const supabase = createClient();

  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarInvitacion, setMostrarInvitacion] =
    useState(false);
  const [emailInvitacion, setEmailInvitacion] = useState("");
  const [enviandoInvitacion, setEnviandoInvitacion] =
    useState(false);
  const [mensajeInvitacion, setMensajeInvitacion] =
    useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    setError("");

    const [
      { data: usuariosData, error: usuariosError },
      { data: rolesData, error: rolesError },
      { data: usuariosEquiposData, error: usuariosEquiposError },
      { data: padresData, error: padresError },
    ] = await Promise.all([
      supabase
        .from("perfil_usuario")
        .select("id, nombre, apellidos")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),

      supabase
        .from("usuario_rol")
        .select("usuario_id, rol"),

      supabase
        .from("usuario_equipo_fase")
        .select(`
          usuario_id,
          equipo_fase_id,
          equipo_fase (
            id,
            fase,
            equipo:idequipo (
              id,
              nombre
            )
          )
        `),

      supabase
        .from("padre_jugador")
        .select("usuario_id, jugador_id"),
    ]);

    if (usuariosError) {
      setError(usuariosError.message);
      setCargando(false);
      return;
    }

    if (rolesError) {
      setError(rolesError.message);
      setCargando(false);
      return;
    }

    if (usuariosEquiposError) {
      setError(usuariosEquiposError.message);
      setCargando(false);
      return;
    }

    if (padresError) {
      setError(padresError.message);
      setCargando(false);
      return;
    }

    const usuariosBase = (usuariosData ?? []) as Usuario[];
    const roles = (rolesData ?? []) as Rol[];
    const usuariosEquipos =
      (usuariosEquiposData ??
        []) as unknown as UsuarioEquipoFase[];
    const padres = (padresData ?? []) as PadreJugador[];

    const usuariosCompletos: UsuarioCompleto[] =
      usuariosBase.map((usuario) => {
        const rolesUsuario = roles
          .filter(
            (item) => item.usuario_id === usuario.id
          )
          .map((item) => item.rol)
          .filter(Boolean);

        const equiposUsuario = usuariosEquipos
          .filter(
            (item) => item.usuario_id === usuario.id
          )
          .map((item) => item.equipo_fase)
          .filter(
            (item): item is EquipoFase =>
              item !== null && item !== undefined
          );

        const jugadoresTutor = new Set(
          padres
            .filter(
              (item) => item.usuario_id === usuario.id
            )
            .map((item) => item.jugador_id)
        ).size;

        return {
          ...usuario,
          roles: rolesUsuario,
          equiposFases: equiposUsuario,
          jugadoresTutor,
        };
      });

    setUsuarios(usuariosCompletos);
    setCargando(false);
  }

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const nombreCompleto =
        `${usuario.nombre ?? ""} ${
          usuario.apellidos ?? ""
        }`.toLowerCase();

      const roles = usuario.roles
        .join(" ")
        .toLowerCase();

      const equipos = usuario.equiposFases
        .map((item) => {
          const nombreEquipo =
            item.equipo?.nombre ?? "";

          const fase =
            item.fase !== null &&
            item.fase !== undefined
              ? `fase ${item.fase}`
              : "";

          return `${nombreEquipo} ${fase}`;
        })
        .join(" ")
        .toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        roles.includes(texto) ||
        equipos.includes(texto)
      );
    });
  }, [usuarios, busqueda]);

  function nombreUsuario(usuario: Usuario) {
    const nombre = usuario.nombre?.trim() ?? "";
    const apellidos =
      usuario.apellidos?.trim() ?? "";

    const completo =
      `${nombre} ${apellidos}`.trim();

    return completo || "Usuario sin nombre";
  }

  function nombreEquipoFase(item: EquipoFase) {
    const nombreEquipo =
      item.equipo?.nombre ?? "Equipo";

    if (
      item.fase !== null &&
      item.fase !== undefined
    ) {
      return `${nombreEquipo} · Fase ${item.fase}`;
    }

    return nombreEquipo;
  }

  async function enviarInvitacion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const email = emailInvitacion.trim().toLowerCase();

    if (!email) {
      return;
    }

    setEnviandoInvitacion(true);
    setError("");
    setMensajeInvitacion("");

    try {
      const response = await fetch(
        "/api/admin/invitar-usuario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.error ??
            "No se ha podido enviar la invitación."
        );
      }

      setMensajeInvitacion(
        `Invitación enviada a ${email}.`
      );
      setEmailInvitacion("");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se ha podido enviar la invitación."
        );
      }
    } finally {
      setEnviandoInvitacion(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin"
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
            ← Volver al panel
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando usuarios...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin"
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
          ← Volver al panel
        </Link>

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Usuarios
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Gestión de usuarios y sus relaciones
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {usuariosFiltrados.length}{" "}
            {usuariosFiltrados.length === 1
              ? "usuario"
              : "usuarios"}
          </span>
        </div>

        {/* INVITAR USUARIO */}
        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Invitar usuario
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Envía un correo para que pueda crear su cuenta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMostrarInvitacion(
                  (actual) => !actual
                );
                setError("");
                setMensajeInvitacion("");
              }}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              {mostrarInvitacion
                ? "Cerrar"
                : "Invitar"}
            </button>
          </div>

          {mostrarInvitacion && (
            <form
              onSubmit={enviarInvitacion}
              className="mt-3 flex gap-2"
            >
              <input
                type="email"
                value={emailInvitacion}
                onChange={(e) =>
                  setEmailInvitacion(e.target.value)
                }
                placeholder="correo@ejemplo.com"
                required
                autoFocus
                className="
                  min-w-0
                  flex-1
                  rounded-lg
                  border
                  border-gray-200
                  px-3
                  py-2
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-500
                "
              />

              <button
                type="submit"
                disabled={enviandoInvitacion}
                className="
                  shrink-0
                  rounded-lg
                  bg-gray-900
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-white
                  transition
                  hover:bg-gray-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {enviandoInvitacion
                  ? "Enviando..."
                  : "Enviar"}
              </button>
            </form>
          )}

          {mensajeInvitacion && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              {mensajeInvitacion}
            </div>
          )}
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <label
            htmlFor="busqueda"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Buscar usuario
          </label>

          <input
            id="busqueda"
            type="text"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Nombre, apellidos, rol o equipo..."
            className="
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
              text-sm
              outline-none
              transition
              placeholder:text-gray-400
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />
        </div>

        <div className="space-y-3">
          {usuariosFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-700">
                No se han encontrado usuarios.
              </p>

              {busqueda && (
                <p className="mt-1 text-sm text-gray-500">
                  Prueba con otro nombre, rol o equipo.
                </p>
              )}
            </div>
          ) : (
            usuariosFiltrados.map((usuario) => (
              <Link
                key={usuario.id}
                href={`/admin/usuarios/${usuario.id}`}
                className="
                  block
                  rounded-2xl
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:shadow-md
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-gray-900">
                      {nombreUsuario(usuario)}
                    </h2>

                    {usuario.roles.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {usuario.roles.map((rol) => (
                          <span
                            key={rol}
                            className="
                              rounded-full
                              bg-blue-50
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              text-blue-700
                            "
                          >
                            {rol}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">
                        Sin roles asignados
                      </p>
                    )}
                  </div>

                  <span className="text-xl text-gray-300">
                    →
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs font-medium text-gray-400">
                      Equipos / fases
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {usuario.equiposFases.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs font-medium text-gray-400">
                      Jugadores como tutor
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {usuario.jugadoresTutor}
                    </p>
                  </div>
                </div>

                {usuario.equiposFases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {usuario.equiposFases
                      .slice(0, 3)
                      .map((item, index) => (
                        <span
                          key={`${item.id}-${index}`}
                          className="
                            rounded-full
                            border
                            border-gray-200
                            bg-white
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            text-gray-600
                          "
                        >
                          {nombreEquipoFase(item)}
                        </span>
                      ))}

                    {usuario.equiposFases.length > 3 && (
                      <span
                        className="
                          rounded-full
                          border
                          border-gray-200
                          bg-gray-50
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                          text-gray-500
                        "
                      >
                        +{usuario.equiposFases.length - 3} más
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
