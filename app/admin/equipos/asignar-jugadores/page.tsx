"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Equipo = {
  id: number;
  nombre: string;
};

type EquipoFase = {
  id: number;
  idequipo: number;
  viva: boolean;
  liga: string | null;
  grupo: string | null;
  subgrupo: string | null;
};

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  activo: boolean;
};

export default function AsignarJugadoresPage() {
  const supabase = createClient();

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [fases, setFases] = useState<EquipoFase[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  const [equipoSeleccionado, setEquipoSeleccionado] =
    useState<number | null>(null);

  const [faseSeleccionada, setFaseSeleccionada] =
    useState<number | null>(null);

  const [jugadoresSeleccionados, setJugadoresSeleccionados] =
    useState<number[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setMensaje("");

    const parametros = new URLSearchParams(
      window.location.search
    );

    const equipoFaseParametro =
      parametros.get("equipo_fase");

    const equipoFaseId = equipoFaseParametro
      ? Number(equipoFaseParametro)
      : null;

    const [
      { data: equiposData, error: equiposError },
      { data: fasesData, error: fasesError },
      { data: jugadoresData, error: jugadoresError },
    ] = await Promise.all([
      supabase
        .from("equipo")
        .select("id,nombre")
        .order("nombre", { ascending: true }),

      supabase
        .from("equipo_fase")
        .select(
          "id,idequipo,viva,liga,grupo,subgrupo"
        )
        .order("id", { ascending: true }),

      supabase
        .from("jugadores")
        .select("id,nombre,apellidos,activo")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),
    ]);

    if (equiposError) {
      setMensaje(equiposError.message);
      setCargando(false);
      return;
    }

    if (fasesError) {
      setMensaje(fasesError.message);
      setCargando(false);
      return;
    }

    if (jugadoresError) {
      setMensaje(jugadoresError.message);
      setCargando(false);
      return;
    }

    const equiposCargados = equiposData ?? [];
    const fasesCargadas = fasesData ?? [];
    const jugadoresCargados = jugadoresData ?? [];

    setEquipos(equiposCargados);
    setFases(fasesCargadas);
    setJugadores(jugadoresCargados);

    /*
     * Si hemos llegado desde:
     *
     * /admin/equipos/asignar-jugadores?equipo_fase=27
     *
     * buscamos automáticamente esa fase.
     */
    if (equipoFaseId) {
      const faseEncontrada = fasesCargadas.find(
        (fase) => fase.id === equipoFaseId
      );

      if (faseEncontrada) {
        setEquipoSeleccionado(
          faseEncontrada.idequipo
        );

        setFaseSeleccionada(
          faseEncontrada.id
        );

        await cargarJugadoresAsignados(
          faseEncontrada.id
        );
      } else {
        setMensaje(
          "No se ha encontrado la fase indicada."
        );
      }
    }

    setCargando(false);
  }

  async function cargarJugadoresAsignados(
    faseId: number
  ) {
    const { data, error } = await supabase
      .from("jugador_equipo_fase")
      .select("jugador_id")
      .eq("equipo_fase_id", faseId);

    if (error) {
      setMensaje(error.message);
      return;
    }

    setJugadoresSeleccionados(
      (data ?? []).map(
        (item) => item.jugador_id
      )
    );
  }

  function cambiarEquipo(id: number) {
    setEquipoSeleccionado(id);
    setFaseSeleccionada(null);
    setJugadoresSeleccionados([]);
    setMensaje("");
  }

  async function cambiarFase(id: number) {
    setFaseSeleccionada(id);
    setMensaje("");

    await cargarJugadoresAsignados(id);
  }

  function alternarJugador(jugadorId: number) {
    setJugadoresSeleccionados((actuales) => {
      if (actuales.includes(jugadorId)) {
        return actuales.filter(
          (id) => id !== jugadorId
        );
      }

      return [...actuales, jugadorId];
    });
  }

  function seleccionarTodos() {
    setJugadoresSeleccionados(
      jugadores
        .filter((jugador) => jugador.activo)
        .map((jugador) => jugador.id)
    );
  }

  function quitarTodos() {
    setJugadoresSeleccionados([]);
  }

  async function guardarAsignaciones() {
    if (!faseSeleccionada) {
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      /*
       * Eliminamos las relaciones actuales
       * de esta fase.
       */
      const { error: eliminarError } =
        await supabase
          .from("jugador_equipo_fase")
          .delete()
          .eq(
            "equipo_fase_id",
            faseSeleccionada
          );

      if (eliminarError) {
        throw eliminarError;
      }

      /*
       * Si no queda ningún jugador,
       * ya hemos terminado.
       */
      if (
        jugadoresSeleccionados.length === 0
      ) {
        setMensaje(
          "Asignaciones actualizadas correctamente."
        );

        setGuardando(false);
        return;
      }

      const fechaInicio =
        new Date()
          .toISOString()
          .split("T")[0];

      const nuevasRelaciones =
        jugadoresSeleccionados.map(
          (jugadorId) => ({
            jugador_id: jugadorId,
            equipo_fase_id:
              faseSeleccionada,
            fecha_inicio: fechaInicio,
            fecha_fin: null,
          })
        );

      const {
        error: insertarError,
      } = await supabase
        .from("jugador_equipo_fase")
        .insert(nuevasRelaciones);

      if (insertarError) {
        throw insertarError;
      }

      setMensaje(
        `${jugadoresSeleccionados.length} jugadores asignados correctamente.`
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "Ha ocurrido un error al guardar."
      );
    } finally {
      setGuardando(false);
    }
  }

  const fasesDelEquipo = fases.filter(
    (fase) =>
      fase.idequipo === equipoSeleccionado
  );

  const equipoActual = equipos.find(
    (equipo) =>
      equipo.id === equipoSeleccionado
  );

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-gray-500">
            Cargando...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">

        {/* VOLVER */}
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

        {/* CABECERA */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Asignar jugadores
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Asigna varios jugadores a un equipo de una sola vez.
          </p>
        </div>

        {/* EQUIPO */}
        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">

          <label className="text-xs font-semibold text-gray-500">
            Equipo
          </label>

          <select
            value={equipoSeleccionado ?? ""}
            onChange={(e) =>
              cambiarEquipo(
                Number(e.target.value)
              )
            }
            className="
              mt-1
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-gray-900
              outline-none
              focus:border-blue-500
            "
          >
            <option value="">
              Selecciona un equipo
            </option>

            {equipos.map((equipo) => (
              <option
                key={equipo.id}
                value={equipo.id}
              >
                {equipo.nombre}
              </option>
            ))}
          </select>

        </section>

        {/* FASE */}
        {equipoSeleccionado && (
          <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">

            <label className="text-xs font-semibold text-gray-500">
              Fase
            </label>

            <select
              value={faseSeleccionada ?? ""}
              onChange={(e) =>
                cambiarFase(
                  Number(e.target.value)
                )
              }
              className="
                mt-1
                w-full
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                py-2.5
                text-sm
                text-gray-900
                outline-none
                focus:border-blue-500
              "
            >
              <option value="">
                Selecciona una fase
              </option>

              {fasesDelEquipo.map(
                (fase) => (
                  <option
                    key={fase.id}
                    value={fase.id}
                  >
                    {fase.liga ??
                      "Sin liga"}
                    {fase.grupo
                      ? ` · Grupo ${fase.grupo}`
                      : ""}
                    {fase.subgrupo
                      ? ` · ${fase.subgrupo}`
                      : ""}
                  </option>
                )
              )}
            </select>

          </section>
        )}

        {/* JUGADORES */}
        {faseSeleccionada && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">

            <div className="mb-4 flex items-center justify-between gap-3">

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Jugadores
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  {jugadoresSeleccionados.length}{" "}
                  seleccionados
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={seleccionarTodos}
                  className="
                    rounded-lg
                    bg-gray-100
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-gray-700
                    hover:bg-gray-200
                  "
                >
                  Todos
                </button>

                <button
                  type="button"
                  onClick={quitarTodos}
                  className="
                    rounded-lg
                    bg-gray-100
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-gray-700
                    hover:bg-gray-200
                  "
                >
                  Ninguno
                </button>

              </div>

            </div>

            <div className="space-y-2">

              {jugadores.map(
                (jugador) => {
                  const seleccionado =
                    jugadoresSeleccionados.includes(
                      jugador.id
                    );

                  return (
                    <label
                      key={jugador.id}
                      className={`
                        flex
                        cursor-pointer
                        items-center
                        gap-3
                        rounded-xl
                        border
                        px-3
                        py-2.5
                        transition
                        ${
                          seleccionado
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                        }
                        ${
                          !jugador.activo
                            ? "opacity-50"
                            : ""
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={
                          seleccionado
                        }
                        disabled={
                          !jugador.activo
                        }
                        onChange={() =>
                          alternarJugador(
                            jugador.id
                          )
                        }
                        className="h-4 w-4"
                      />

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-semibold text-gray-900">
                          {jugador.apellidos},{" "}
                          {jugador.nombre}
                        </p>

                        {!jugador.activo && (
                          <p className="text-xs text-gray-400">
                            Jugador inactivo
                          </p>
                        )}

                      </div>
                    </label>
                  );
                }
              )}

            </div>

            {/* GUARDAR */}
            <button
              type="button"
              onClick={guardarAsignaciones}
              disabled={guardando}
              className="
                mt-5
                w-full
                rounded-xl
                bg-blue-600
                px-4
                py-3
                text-sm
                font-bold
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {guardando
                ? "Guardando..."
                : `Guardar asignaciones (${jugadoresSeleccionados.length})`}
            </button>

            {mensaje && (
              <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-center text-xs text-gray-600">
                {mensaje}
              </p>
            )}

          </section>
        )}

        {/* AYUDA */}
        {!faseSeleccionada && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-5 text-blue-800">
              Selecciona un equipo y una fase para comenzar a asignar jugadores.
            </p>
          </section>
        )}

      </div>
    </main>
  );
}
