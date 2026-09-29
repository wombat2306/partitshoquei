"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
};

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  activo: boolean;
};

type PadreJugador = {
  usuario_id: string;
  jugador_id: number;
};

type PadreCompleto = Usuario & {
  jugadores: Jugador[];
};

export default function PadresAdminPage() {
  const supabase = createClient();

  const [padres, setPadres] = useState<PadreCompleto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPadres();
  }, []);

  async function cargarPadres() {
    setCargando(true);
    setError("");

    const [
      { data: relacionesData, error: relacionesError },
      { data: usuariosData, error: usuariosError },
      { data: jugadoresData, error: jugadoresError },
    ] = await Promise.all([
      supabase
        .from("padre_jugador")
        .select("usuario_id, jugador_id"),

      supabase
        .from("perfil_usuario")
        .select("id, nombre, apellidos")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),

      supabase
        .from("jugadores")
        .select("id, nombre, apellidos, activo")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),
    ]);

    if (relacionesError) {
      setError(relacionesError.message);
      setCargando(false);
      return;
    }

    if (usuariosError) {
      setError(usuariosError.message);
      setCargando(false);
      return;
    }

    if (jugadoresError) {
      setError(jugadoresError.message);
      setCargando(false);
      return;
    }

    const relaciones = (relacionesData ?? []) as PadreJugador[];
    const usuarios = (usuariosData ?? []) as Usuario[];
    const jugadores = (jugadoresData ?? []) as Jugador[];

    const usuariosMap = new Map<string, Usuario>(
      usuarios.map((usuario) => [usuario.id, usuario])
    );

    const jugadoresMap = new Map<number, Jugador>(
      jugadores.map((jugador) => [jugador.id, jugador])
    );

    const idsPadres = [
      ...new Set(relaciones.map((relacion) => relacion.usuario_id)),
    ];

    const padresCompletos: PadreCompleto[] = idsPadres
      .map((usuarioId) => {
        const usuario = usuariosMap.get(usuarioId);

        if (!usuario) {
          return null;
        }

        const jugadoresPadre = relaciones
          .filter(
            (relacion) => relacion.usuario_id === usuarioId
          )
          .map((relacion) =>
            jugadoresMap.get(relacion.jugador_id)
          )
          .filter(
            (jugador): jugador is Jugador =>
              jugador !== undefined
          )
          .sort((a, b) =>
            `${a.apellidos} ${a.nombre}`.localeCompare(
              `${b.apellidos} ${b.nombre}`,
              "es"
            )
          );

        return {
          ...usuario,
          jugadores: jugadoresPadre,
        };
      })
      .filter(
        (padre): padre is PadreCompleto =>
          padre !== null
      )
      .sort((a, b) =>
        `${a.apellidos ?? ""} ${a.nombre ?? ""}`.localeCompare(
          `${b.apellidos ?? ""} ${b.nombre ?? ""}`,
          "es"
        )
      );

    setPadres(padresCompletos);
    setCargando(false);
  }

  const padresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return padres;
    }

    return padres.filter((padre) => {
      const nombrePadre =
        `${padre.nombre ?? ""} ${padre.apellidos ?? ""}`.toLowerCase();

      const jugadoresPadre = padre.jugadores
        .map(
          (jugador) =>
            `${jugador.nombre} ${jugador.apellidos}`
        )
        .join(" ")
        .toLowerCase();

      return (
        nombrePadre.includes(texto) ||
        jugadoresPadre.includes(texto)
      );
    });
  }, [padres, busqueda]);

  function nombrePadre(padre: Usuario) {
    const nombre = padre.nombre?.trim() ?? "";
    const apellidos = padre.apellidos?.trim() ?? "";

    return (
      `${nombre} ${apellidos}`.trim() ||
      "Usuario sin nombre"
    );
  }

  function nombreJugador(jugador: Jugador) {
    return `${jugador.nombre} ${jugador.apellidos}`.trim();
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
              Cargando padres y tutores...
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
              Padres / tutores
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Usuarios vinculados con jugadores
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {padresFiltrados.length}{" "}
            {padresFiltrados.length === 1
              ? "tutor"
              : "tutores"}
          </span>
        </div>

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
            Buscar padre / tutor
          </label>

          <input
            id="busqueda"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre del tutor o jugador..."
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
          {padresFiltrados.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-700">
                No se han encontrado padres o tutores.
              </p>

              {busqueda && (
                <p className="mt-1 text-sm text-gray-500">
                  Prueba con otro nombre.
                </p>
              )}
            </div>
          ) : (
            padresFiltrados.map((padre) => (
              <Link
                key={padre.id}
                href={`/admin/usuarios/${padre.id}`}
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
                    <h2 className="font-bold text-gray-900">
                      {nombrePadre(padre)}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {padre.jugadores.length}{" "}
                      {padre.jugadores.length === 1
                        ? "jugador vinculado"
                        : "jugadores vinculados"}
                    </p>
                  </div>

                  <span className="text-xl text-gray-300">
                    →
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {padre.jugadores.map((jugador) => (
                    <div
                      key={jugador.id}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        rounded-xl
                        bg-gray-50
                        px-3
                        py-2.5
                      "
                    >
                      <span className="min-w-0 truncate text-sm font-semibold text-gray-700">
                        {nombreJugador(jugador)}
                      </span>

                      {!jugador.activo && (
                        <span
                          className="
                            shrink-0
                            rounded-full
                            bg-gray-200
                            px-2
                            py-1
                            text-[11px]
                            font-semibold
                            text-gray-500
                          "
                        >
                          Inactivo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
