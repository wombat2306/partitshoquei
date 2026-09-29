"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  created_at: string | null;
};

type Temporada = {
  id: number;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
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
  created_at: string | null;
};

type JugadorEquipoFase = {
  jugador_id: number;
  equipo_fase_id: number;
};

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  dorsal: number | null;
  activo: boolean;
  esportero: boolean;
};

export default function EquipoDetallePage() {
  const params = useParams();
  const supabase = createClient();

  const equipoId = Number(params.id);

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [temporada, setTemporada] =
    useState<Temporada | null>(null);

  const [fases, setFases] = useState<
    Array<EquipoFase & { jugadores: number }>
  >([]);

  const [fasesAbiertas, setFasesAbiertas] = useState<number[]>(
    []
  );

  const [jugadoresPorFase, setJugadoresPorFase] = useState<
    Record<number, Jugador[]>
  >({});

  const [cargandoJugadores, setCargandoJugadores] =
    useState<number | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(equipoId)) {
      setError("El equipo indicado no es válido.");
      setCargando(false);
      return;
    }

    cargarDatos();
  }, [equipoId]);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [
        { data: equipoData, error: equipoError },
        { data: temporadaData, error: temporadaError },
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
              orden_categoria,
              created_at
            `
          )
          .eq("id", equipoId)
          .maybeSingle(),

        supabase
          .from("temporada")
          .select(
            `
              id,
              nombre,
              fecha_inicio,
              fecha_fin,
              activa
            `
          )
          .eq("activa", true)
          .maybeSingle(),
      ]);

      if (equipoError) {
        throw equipoError;
      }

      if (temporadaError) {
        throw temporadaError;
      }

      if (!equipoData) {
        setEquipo(null);
        setTemporada(temporadaData);
        setFases([]);
        setError("No se ha encontrado el equipo.");
        return;
      }

      setEquipo(equipoData);
      setTemporada(temporadaData);

      if (!temporadaData) {
        setFases([]);
        return;
      }

      const [
        { data: fasesData, error: fasesError },
        { data: jugadoresFaseData, error: jugadoresFaseError },
      ] = await Promise.all([
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
              fecha_fin,
              created_at
            `
          )
          .eq("idequipo", equipoId)
          .eq("idtemporada", temporadaData.id)
          .order("fase", {
            ascending: true,
          }),

        supabase
          .from("jugador_equipo_fase")
          .select("jugador_id, equipo_fase_id"),
      ]);

      if (fasesError) {
        throw fasesError;
      }

      if (jugadoresFaseError) {
        throw jugadoresFaseError;
      }

      const jugadoresPorFaseContador = new Map<number, number>();

      for (const relacion of (jugadoresFaseData ??
        []) as JugadorEquipoFase[]) {
        jugadoresPorFaseContador.set(
          relacion.equipo_fase_id,
          (jugadoresPorFaseContador.get(
            relacion.equipo_fase_id
          ) ?? 0) + 1
        );
      }

      const fasesConJugadores = (
        (fasesData ?? []) as EquipoFase[]
      ).map((fase) => ({
        ...fase,
        jugadores:
          jugadoresPorFaseContador.get(fase.id) ?? 0,
      }));

      setFases(fasesConJugadores);
    } catch (err) {
      console.error(err);

      setError(
        "No se ha podido cargar la información del equipo."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarJugadoresDeFase(faseId: number) {
    setCargandoJugadores(faseId);

    try {
      const { data: relaciones, error: relacionesError } =
        await supabase
          .from("jugador_equipo_fase")
          .select("jugador_id")
          .eq("equipo_fase_id", faseId);

      if (relacionesError) {
        throw relacionesError;
      }

      const idsJugadores = (relaciones ?? []).map(
        (relacion) => relacion.jugador_id
      );

      if (idsJugadores.length === 0) {
        setJugadoresPorFase((actual) => ({
          ...actual,
          [faseId]: [],
        }));

        return;
      }

      const { data: jugadoresData, error: jugadoresError } =
        await supabase
          .from("jugadores")
          .select(
            `
              id,
              nombre,
              apellidos,
              dorsal,
              activo,
              esportero
            `
          )
          .in("id", idsJugadores)
          .order("apellidos", {
            ascending: true,
          })
          .order("nombre", {
            ascending: true,
          });

      if (jugadoresError) {
        throw jugadoresError;
      }

      setJugadoresPorFase((actual) => ({
        ...actual,
        [faseId]: (jugadoresData ?? []) as Jugador[],
      }));
    } catch (err) {
      console.error(err);

      setJugadoresPorFase((actual) => ({
        ...actual,
        [faseId]: [],
      }));
    } finally {
      setCargandoJugadores(null);
    }
  }

  async function alternarJugadores(faseId: number) {
    const abierta = fasesAbiertas.includes(faseId);

    if (abierta) {
      setFasesAbiertas((actual) =>
        actual.filter((id) => id !== faseId)
      );

      return;
    }

    if (!jugadoresPorFase[faseId]) {
      await cargarJugadoresDeFase(faseId);
    }

    setFasesAbiertas((actual) => [
      ...actual,
      faseId,
    ]);
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) {
      return "—";
    }

    const [year, month, day] = fecha.split("-");

    if (!year || !month || !day) {
      return fecha;
    }

    return `${day}/${month}/${year}`;
  }

  function nombreFase(fase: EquipoFase) {
    return fase.fase !== null
      ? `Fase ${fase.fase}`
      : "Fase";
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/equipos"
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
            ← Volver a equipos
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando equipo...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !equipo) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/equipos"
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
            ← Volver a equipos
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error || "No se ha encontrado el equipo."}
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/admin/equipos"
            className="
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
            ← Volver a equipos
          </Link>

          <Link
            href={`/admin/equipos/${equipo.id}/editar`}
            className="
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
            Editar
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            {equipo.nombre}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Ficha del equipo
          </p>
        </div>

        <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Datos del equipo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Nombre
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.nombre || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Categoría
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.categoria || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Liga
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.liga || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Grupo
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.grupo || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Subgrupo
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.subgrup || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Etiqueta
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.etiqueta || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                ID Club
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.idClub ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                FECAPA
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {equipo.fecapa ? "Sí" : "No"}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Fases
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {temporada
                    ? `Temporada ${temporada.nombre}`
                    : "No hay temporada activa"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {fases.length}{" "}
                {fases.length === 1 ? "fase" : "fases"}
              </span>
            </div>

            <Link
              href={`/admin/equipos/${equipo.id}/fases/nueva`}
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                px-4
                py-3
                text-sm
                font-semibold
                text-blue-700
                transition
                hover:bg-blue-100
              "
            >
              <span className="mr-2 text-lg leading-none">
                +
              </span>
              Añadir fase
            </Link>
          </div>

          {fases.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <p className="font-semibold text-gray-900">
                No hay fases
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Este equipo todavía no tiene fases en la
                temporada activa.
              </p>

              <Link
                href={`/admin/equipos/${equipo.id}/fases/nueva`}
                className="
                  mt-4
                  inline-flex
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
                + Añadir fase
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {fases.map((fase) => {
                const faseAbierta =
                  fasesAbiertas.includes(fase.id);

                const jugadores =
                  jugadoresPorFase[fase.id] ?? [];

                return (
                  <div
                    key={fase.id}
                    className="
                      rounded-2xl
                      bg-white
                      p-5
                      shadow-sm
                    "
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {nombreFase(fase)}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
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
                            .join(" · ") ||
                            "Sin datos de competición"}
                        </p>
                      </div>

                      {fase.viva ? (
                        <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Activa
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                          Inactiva
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Inicio
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatearFecha(
                            fase.fecha_inicio
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Fin
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatearFecha(
                            fase.fecha_fin
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {fase.jugadores}
                        </p>

                        <p className="text-xs text-gray-500">
                          {fase.jugadores === 1
                            ? "jugador asignado"
                            : "jugadores asignados"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          alternarJugadores(fase.id)
                        }
                        className="
                          rounded-xl
                          border
                          border-blue-200
                          bg-blue-50
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-blue-700
                          transition
                          hover:bg-blue-100
                        "
                      >
                        {cargandoJugadores === fase.id
                          ? "Cargando..."
                          : faseAbierta
                            ? "Ocultar jugadores"
                            : "Ver jugadores"}
                      </button>
                    </div>

                    {faseAbierta && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">
                            Jugadores asignados
                          </p>

                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            {jugadores.length}
                          </span>
                        </div>

                        {jugadores.length === 0 ? (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                            <p className="text-sm text-gray-500">
                              No hay jugadores asignados.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {jugadores.map((jugador) => (
                              <div
                                key={jugador.id}
                                className="
                                  flex
                                  items-center
                                  rounded-xl
                                  border
                                  border-gray-100
                                  bg-gray-50
                                  px-3
                                  py-2.5
                                "
                              >
                                <div className="w-10 shrink-0 text-center text-sm font-bold text-gray-700">
                                  {jugador.dorsal ?? "—"}
                                </div>

                                <div className="ml-2 min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {jugador.nombre}{" "}
                                    {jugador.apellidos}

                                    {Boolean(jugador.esportero) && (
                                      <span
                                        className="ml-2"
                                        title="Portero"
                                        aria-label="Portero"
                                      >
                                        🧤
                                      </span>
                                    )}
                                  </p>

                                  {!jugador.activo && (
                                    <p className="text-xs text-gray-400">
                                      Inactivo
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Link
                          href={`/admin/equipos/asignar-jugadores?equipo_fase=${fase.id}`}
                          className="
                            mt-3
                            flex
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-semibold
                            text-gray-700
                            transition
                            hover:bg-gray-50
                          "
                        >
                          Gestionar jugadores
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
