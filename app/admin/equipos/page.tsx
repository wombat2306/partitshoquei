"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Temporada = {
  id: number;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
};

type Equipo = {
  id: number;
  nombre: string;
  grupo: string | null;
  liga: string | null;
  etiqueta: string | null;
  fecapa: boolean | null;
  idClub: number | null;
  categoria: string | null;
  subgrup: string | null;
  orden_categoria: number | null;
};

type EquipoFase = {
  id: number;
  idequipo: number;
  idtemporada: number;
  fase: number | null;
  liga: string | null;
  grupo: string | null;
  subgrupo: string | null;
  viva: boolean | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type JugadorEquipoFase = {
  jugador_id: number;
  equipo_fase_id: number;
};

type EquipoConFases = Equipo & {
  fases: Array<
    EquipoFase & {
      jugadores: number;
    }
  >;
};

export default function EquiposPage() {
  const supabase = createClient();

  const [temporada, setTemporada] =
    useState<Temporada | null>(null);

  const [equipos, setEquipos] =
    useState<EquipoConFases[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const {
        data: temporadaData,
        error: temporadaError,
      } = await supabase
        .from("temporada")
        .select(
          "id, nombre, fecha_inicio, fecha_fin, activa"
        )
        .eq("activa", true)
        .maybeSingle();

      if (temporadaError) {
        throw temporadaError;
      }

      if (!temporadaData) {
        setTemporada(null);
        setEquipos([]);
        return;
      }

      setTemporada(temporadaData);

      const [
        {
          data: equiposData,
          error: equiposError,
        },
        {
          data: fasesData,
          error: fasesError,
        },
        {
          data: jugadoresFaseData,
          error: jugadoresFaseError,
        },
      ] = await Promise.all([
        supabase
          .from("equipo")
          .select(
            `
              id,
              nombre,
              grupo,
              liga,
              etiqueta,
              fecapa,
              idClub,
              categoria,
              subgrup,
              orden_categoria
            `
          )
          .order("orden_categoria", {
            ascending: true,
            nullsFirst: false,
          })
          .order("nombre", {
            ascending: true,
          }),

        supabase
          .from("equipo_fase")
          .select(
            `
              id,
              idequipo,
              idtemporada,
              fase,
              liga,
              grupo,
              subgrupo,
              viva,
              fecha_inicio,
              fecha_fin
            `
          )
          .eq("idtemporada", temporadaData.id)
          .order("fase", {
            ascending: true,
          }),

        supabase
          .from("jugador_equipo_fase")
          .select(
            "jugador_id, equipo_fase_id"
          ),
      ]);

      if (equiposError) {
        throw equiposError;
      }

      if (fasesError) {
        throw fasesError;
      }

      if (jugadoresFaseError) {
        throw jugadoresFaseError;
      }

      const fases =
        (fasesData ?? []) as EquipoFase[];

      const jugadoresFase =
        (jugadoresFaseData ??
          []) as JugadorEquipoFase[];

      const jugadoresPorFase =
        new Map<number, number>();

      for (const relacion of jugadoresFase) {
        jugadoresPorFase.set(
          relacion.equipo_fase_id,
          (jugadoresPorFase.get(
            relacion.equipo_fase_id
          ) ?? 0) + 1
        );
      }

      const fasesPorEquipo =
        new Map<
          number,
          EquipoConFases["fases"]
        >();

      for (const fase of fases) {
        const faseConJugadores = {
          ...fase,
          jugadores:
            jugadoresPorFase.get(fase.id) ?? 0,
        };

        const existentes =
          fasesPorEquipo.get(
            fase.idequipo
          ) ?? [];

        existentes.push(
          faseConJugadores
        );

        fasesPorEquipo.set(
          fase.idequipo,
          existentes
        );
      }

      const resultado: EquipoConFases[] =
        ((equiposData ?? []) as Equipo[]).map(
          (equipo) => ({
            ...equipo,
            fases:
              fasesPorEquipo.get(
                equipo.id
              ) ?? [],
          })
        );

      setEquipos(resultado);
    } catch (err) {
      console.error(err);

      setError(
        "No se han podido cargar los equipos. Inténtalo de nuevo."
      );
    } finally {
      setCargando(false);
    }
  }

  const equiposFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    if (!texto) {
      return equipos;
    }

    return equipos.filter((equipo) => {
      const datosEquipo = [
        equipo.nombre,
        equipo.categoria,
        equipo.grupo,
        equipo.liga,
        equipo.etiqueta,
        equipo.subgrup,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const datosFases = equipo.fases
        .map((fase) =>
          [
            fase.fase !== null
              ? `fase ${fase.fase}`
              : "",
            fase.liga,
            fase.grupo,
            fase.subgrupo,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        )
        .join(" ");

      return (
        datosEquipo.includes(texto) ||
        datosFases.includes(texto)
      );
    });
  }, [equipos, busqueda]);

  function formatearFecha(
    fecha: string | null
  ) {
    if (!fecha) {
      return "—";
    }

    const [year, month, day] =
      fecha.split("-");

    if (!year || !month || !day) {
      return fecha;
    }

    return `${day}/${month}/${year}`;
  }

  function textoFase(
    fase: EquipoFase
  ) {
    return fase.fase !== null
      ? `Fase ${fase.fase}`
      : "Fase";
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">

        {/* VOLVER */}
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
          ← Volver a administración
        </Link>

        {/* CABECERA */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Equipos / fases
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Equipos y fases de la temporada activa
              </p>
            </div>

            <Link
              href="/admin/equipos/nuevo"
              className="
                shrink-0
                rounded-xl
                bg-blue-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              + Nuevo equipo
            </Link>

          </div>
        </div>

        {/* CARGANDO */}
        {cargando ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando equipos...
            </p>
          </div>

        ) : error ? (

          /* ERROR */
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={cargarDatos}
              className="
                mt-3
                rounded-xl
                bg-red-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-red-700
              "
            >
              Reintentar
            </button>
          </div>

        ) : !temporada ? (

          /* SIN TEMPORADA */
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="font-semibold text-gray-900">
              No hay una temporada activa
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Activa una temporada para poder gestionar sus fases.
            </p>
          </div>

        ) : (

          <>
            {/* TEMPORADA */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">

              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Temporada activa
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {temporada.nombre}
              </p>

              {(temporada.fecha_inicio ||
                temporada.fecha_fin) && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatearFecha(
                    temporada.fecha_inicio
                  )}{" "}
                  →{" "}
                  {formatearFecha(
                    temporada.fecha_fin
                  )}
                </p>
              )}

            </div>

            {/* BUSCADOR */}
            <div className="mb-5">
              <input
                type="text"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                placeholder="Buscar equipo, categoría, liga, grupo o fase..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  shadow-sm
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            {/* CONTADOR */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {equiposFiltrados.length}{" "}
                {equiposFiltrados.length === 1
                  ? "equipo"
                  : "equipos"}
              </p>
            </div>

            {/* SIN EQUIPOS */}
            {equiposFiltrados.length === 0 ? (

              <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

                <p className="font-semibold text-gray-900">
                  No hay equipos
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {busqueda.trim()
                    ? "No se han encontrado equipos con esa búsqueda."
                    : "Todavía no hay equipos registrados."}
                </p>

              </div>

            ) : (

              /* EQUIPOS */
              <div className="space-y-4">

                {equiposFiltrados.map(
                  (equipo) => (

                    <Link
                      key={equipo.id}
                      href={`/admin/equipos/${equipo.id}`}
                      className="
                        block
                        rounded-2xl
                        bg-white
                        p-5
                        shadow-sm
                        transition
                        hover:shadow-md
                      "
                    >

                      {/* CABECERA EQUIPO */}
                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h2 className="text-lg font-bold text-gray-900">
                            {equipo.nombre}
                          </h2>

                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">

                            {equipo.categoria && (
                              <span>
                                {equipo.categoria}
                              </span>
                            )}

                            {equipo.grupo && (
                              <span>
                                · Grupo {equipo.grupo}
                              </span>
                            )}

                            {equipo.liga && (
                              <span>
                                · {equipo.liga}
                              </span>
                            )}

                          </div>

                        </div>

                        <span className="shrink-0 text-xl text-gray-300">
                          →
                        </span>

                      </div>

                      {/* FASES */}
                      <div className="mt-4 border-t border-gray-100 pt-4">

                        {equipo.fases.length === 0 ? (

                          <p className="text-sm text-gray-400">
                            Sin fases en la temporada activa
                          </p>

                        ) : (

                          <div className="space-y-3">

                            {equipo.fases.map(
                              (fase) => (

                                <div
                                  key={fase.id}
                                  className="
                                    rounded-xl
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    p-3
                                  "
                                >

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0">

                                      <p className="font-semibold text-gray-900">
                                        {textoFase(fase)}
                                      </p>

                                      <div className="mt-1 text-sm text-gray-500">

                                        {(fase.liga ||
                                          fase.grupo ||
                                          fase.subgrupo) && (
                                          <div>
                                            {[
                                              fase.liga,
                                              fase.grupo
                                                ? `Grupo ${fase.grupo}`
                                                : null,
                                              fase.subgrupo
                                                ? `Subgrupo ${fase.subgrupo}`
                                                : null,
                                            ]
                                              .filter(Boolean)
                                              .join(" · ")}
                                          </div>
                                        )}

                                        <div className="mt-1">
                                          {formatearFecha(
                                            fase.fecha_inicio
                                          )}{" "}
                                          →{" "}
                                          {formatearFecha(
                                            fase.fecha_fin
                                          )}
                                        </div>

                                      </div>

                                    </div>

                                    <div className="shrink-0 text-right">

                                      <p className="text-sm font-semibold text-gray-900">
                                        {fase.jugadores}
                                      </p>

                                      <p className="text-xs text-gray-400">
                                        {fase.jugadores === 1
                                          ? "jugador"
                                          : "jugadores"}
                                      </p>

                                    </div>

                                  </div>

                                  {/* ESTADO */}
                                  <div className="mt-3 flex items-center justify-between gap-3">

                                    <div>
                                      {fase.viva ? (
                                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                          Activa
                                        </span>
                                      ) : (
                                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                          Inactiva
                                        </span>
                                      )}
                                    </div>

                                    {/* ASIGNAR JUGADORES */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        window.location.href =
                                          `/admin/equipos/asignar-jugadores?equipo_fase=${fase.id}`;
                                      }}
                                      className="
                                        inline-flex
                                        items-center
                                        rounded-xl
                                        bg-blue-50
                                        px-3
                                        py-2
                                        text-xs
                                        font-semibold
                                        text-blue-700
                                        transition
                                        hover:bg-blue-100
                                      "
                                    >
                                      👥 Asignar jugadores
                                    </button>

                                  </div>

                                </div>

                              )
                            )}

                          </div>

                        )}

                      </div>

                    </Link>

                  )
                )}

              </div>

            )}

          </>
        )}

      </div>
    </main>
  );
}
