"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const supabase = createClient();

type Equipo = {
  id: number;
  nombre: string;
};

type EquipoFase = {
  id: number;
  idequipo: number;
  viva: boolean;
  liga?: string | null;
  grupo?: string | null;
  subgrupo?: string | null;
};

type EquipoAsignado = {
  equipoFaseId: number;
  equipoId: number;
  nombreEquipo: string;
  fase: EquipoFase;
};

type Jugador = {
  id: number;
  nombre?: string;
  apellidos?: string;
  esportero: boolean;
};

type Partido = {
  id: number;
  idequipo_fase: number;
  fecha: string;
  hora: string;
};

type Disponibilidad = {
  jugador_id: number;
  fecha_fin_de_semana: string;
  sabado_manana: boolean;
  sabado_tarde: boolean;
  domingo_manana: boolean;
  domingo_tarde: boolean;
};

type Momento =
  | "sabado_manana"
  | "sabado_tarde"
  | "domingo_manana"
  | "domingo_tarde";

type ResumenMomento = {
  disponibles: number;
  noDisponibles: number;
  total: number;
};

export default function DisponibilidadEquipoPage() {
  const router = useRouter();

  const [equiposAsignados, setEquiposAsignados] =
    useState<EquipoAsignado[]>([]);

  const [selectedEquipoFase, setSelectedEquipoFase] =
    useState<number | null>(null);

  const [selectedWeekend, setSelectedWeekend] =
    useState<Date | null>(null);

  const [jugadores, setJugadores] =
    useState<Jugador[]>([]);

  const [partido, setPartido] =
    useState<Partido | null>(null);

  const [disponibilidades, setDisponibilidades] =
    useState<Record<number, Disponibilidad>>({});

  const [loading, setLoading] =
    useState(true);

  const [loadingDatos, setLoadingDatos] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarJugadores, setMostrarJugadores] = useState(false);


  /*
   * Inicio de la temporada:
   * lunes de la semana actual.
   */
  const inicio = useMemo(() => {
    return startOfWeek(new Date(), {
      weekStartsOn: 1,
    });
  }, []);

  /*
   * Final:
   * 30 de junio del año siguiente.
   */
  const fin = useMemo(() => {
    const hoy = new Date();

    return new Date(
      hoy.getFullYear() + 1,
      5,
      30
    );
  }, []);

  /*
   * Sábados disponibles.
   */
  const weekends = useMemo(() => {
    const result: Date[] = [];

    let current = inicio;

    while (current <= fin) {
      if (current.getDay() === 6) {
        result.push(current);
      }

      current = addDays(current, 1);
    }

    return result;
  }, [inicio, fin]);

  /*
   * Cargar únicamente los equipos/fases
   * asignados al usuario actual.
   *
   * usuario_equipo_fase
   *      ↓
   * equipo_fase
   *      ↓
   * equipo
   */
  useEffect(() => {
    async function loadEquiposAsignados() {
      setLoading(true);
      setError("");

      try {
        /*
         * 1. Obtener las asignaciones del usuario.
         */
        const {
          data: usuario,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError) {
          console.error(usuarioError);

          throw new Error(
            "No se ha podido comprobar el usuario."
          );
        }

        if (!usuario.user) {
          router.push("/socios");
          return;
        }

        const {
          data: asignaciones,
          error: asignacionesError,
        } = await supabase
          .from("usuario_equipo_fase")
          .select("equipo_fase_id, rol")
          .eq("usuario_id", usuario.user.id)
          .in("rol", ["entrenador", "delegado"]);

        if (asignacionesError) {
          console.error(asignacionesError);

          throw new Error(
            "No se han podido cargar tus equipos asignados."
          );
        }

        const idsFases =
          (asignaciones ?? []).map(
            (item) => item.equipo_fase_id
          );

        if (idsFases.length === 0) {
          setEquiposAsignados([]);
          setSelectedEquipoFase(null);
          setLoading(false);
          return;
        }

        /*
         * 2. Obtener las fases asignadas.
         */
        const {
          data: fases,
          error: fasesError,
        } = await supabase
          .from("equipo_fase")
          .select(
            `
              id,
              idequipo,
              viva,
              liga,
              grupo,
              subgrupo
            `
          )
          .in("id", idsFases);

        if (fasesError) {
          console.error(fasesError);

          throw new Error(
            "No se han podido cargar las fases de los equipos."
          );
        }

        const idsEquipos = [
          ...new Set(
            (fases ?? []).map(
              (fase) => fase.idequipo
            )
          ),
        ];

        /*
         * 3. Obtener los nombres de los equipos.
         */
        const {
          data: equiposData,
          error: equiposError,
        } = await supabase
          .from("equipo")
          .select("id, nombre")
          .in("id", idsEquipos)
          .order("nombre");

        if (equiposError) {
          console.error(equiposError);

          throw new Error(
            "No se han podido cargar los equipos."
          );
        }

        const mapaEquipos =
          new Map<number, Equipo>();

        (equiposData ?? []).forEach(
          (equipo) => {
            mapaEquipos.set(
              equipo.id,
              equipo
            );
          }
        );

        /*
 * 4. Construir la lista final.
 */
const resultado = (fases ?? [])
  .map((fase) => {
    const equipo =
      mapaEquipos.get(fase.idequipo);

    if (!equipo) {
      return null;
    }

    return {
      equipoFaseId: fase.id,
      equipoId: fase.idequipo,
      nombreEquipo: equipo.nombre,
      fase: {
        id: fase.id,
        idequipo: fase.idequipo,
        viva: fase.viva,
        liga: fase.liga,
        grupo: fase.grupo,
        subgrupo: fase.subgrupo,
      },
    };
  })
  .filter((item) => item !== null)
  .sort((a, b) =>
    a.nombreEquipo.localeCompare(
      b.nombreEquipo,
      "es"
    )
  );

        setEquiposAsignados(resultado);

        /*
         * Seleccionar automáticamente
         * el primero.
         */
        if (resultado.length > 0) {
          setSelectedEquipoFase(
            resultado[0].equipoFaseId
          );
        } else {
          setSelectedEquipoFase(null);
        }

        /*
         * Seleccionar inicialmente
         * el primer fin de semana.
         */
        if (weekends.length > 0) {
          setSelectedWeekend(
            weekends[0]
          );
        }
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "No se han podido cargar los equipos."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEquiposAsignados();
  }, [weekends, router]);

  /*
   * Convertir fecha "dd/MM/yyyy"
   * a Date.
   */
  function parseFechaPartido(
    fecha: string
  ) {
    const partes = fecha.split("/");

    if (partes.length !== 3) {
      return null;
    }

    const dia = Number(partes[0]);
    const mes = Number(partes[1]);
    const año = Number(partes[2]);

    if (!dia || !mes || !año) {
      return null;
    }

    return new Date(
      año,
      mes - 1,
      dia,
      12,
      0,
      0
    );
  }

  /*
   * Calcular el sábado correspondiente
   * a cualquier fecha.
   */
  function getWeekendFromDate(
    fecha: Date
  ) {
    if (fecha.getDay() === 6) {
      return fecha;
    }

    if (fecha.getDay() === 0) {
      return subDays(fecha, 1);
    }

    const lunes =
      startOfWeek(fecha, {
        weekStartsOn: 1,
      });

    return addDays(lunes, 5);
  }

  /*
   * Fecha seleccionada por el usuario.
   */
  function handleDateChange(
    value: string
  ) {
    if (!value) {
      return;
    }

    const fecha = new Date(
      `${value}T12:00:00`
    );

    const weekend =
      getWeekendFromDate(fecha);

    setSelectedWeekend(weekend);
  }

  /*
   * Cargar jugadores, disponibilidad
   * y partido del equipo/fase seleccionado.
   */
  useEffect(() => {
    if (
      !selectedEquipoFase ||
      !selectedWeekend
    ) {
      return;
    }

    const equipoFaseId =
      selectedEquipoFase;

    const weekend =
      selectedWeekend;

    async function loadDatos() {
      setLoadingDatos(true);
      setError("");

      setJugadores([]);
      setPartido(null);
      setDisponibilidades({});

      try {
        /*
         * 1. Buscar los jugadores de la fase.
         */
        const {
          data: relaciones,
          error: relacionesError,
        } = await supabase
          .from("jugador_equipo_fase")
          .select("jugador_id")
          .eq(
            "equipo_fase_id",
            equipoFaseId
          );

        if (relacionesError) {
          console.error(relacionesError);

          throw new Error(
            "No se han podido cargar los jugadores del equipo."
          );
        }

        const jugadorIds =
          relaciones?.map(
            (item) => item.jugador_id
          ) ?? [];

        if (jugadorIds.length === 0) {
          setJugadores([]);
          setLoadingDatos(false);
          return;
        }

        /*
         * 2. Información de los jugadores.
         */
        const {
          data: jugadoresData,
          error: jugadoresError,
        } = await supabase
          .from("jugadores")
          .select(
            "id, nombre, apellidos, esportero"
          )
          .in("id", jugadorIds)
          .order("nombre");

        if (jugadoresError) {
          console.error(jugadoresError);

          throw new Error(
            "No se han podido cargar los jugadores."
          );
        }

        setJugadores(
          jugadoresData ?? []
        );

        /*
         * 3. Buscar disponibilidad.
         */
        const fechaWeekend =
          format(
            weekend,
            "yyyy-MM-dd"
          );

        const {
          data: disponibilidadData,
          error: disponibilidadError,
        } = await supabase
          .from(
            "disponibilidad_jugador"
          )
          .select(
            `
              jugador_id,
              fecha_fin_de_semana,
              sabado_manana,
              sabado_tarde,
              domingo_manana,
              domingo_tarde
            `
          )
          .in(
            "jugador_id",
            jugadorIds
          )
          .eq(
            "fecha_fin_de_semana",
            fechaWeekend
          );

        if (disponibilidadError) {
          console.error(
            disponibilidadError
          );

          throw new Error(
            "No se ha podido cargar la disponibilidad."
          );
        }

        const mapa: Record<
          number,
          Disponibilidad
        > = {};

        (
          disponibilidadData ?? []
        ).forEach((item) => {
          mapa[item.jugador_id] =
            item;
        });

        setDisponibilidades(mapa);

        /*
         * 4. Buscar partidos del equipo/fase.
         */
        const {
          data: partidosData,
          error: partidosError,
        } = await supabase
          .from("partido")
          .select(
            "id, idequipo_fase, fecha, hora"
          )
          .eq(
            "idequipo_fase",
            equipoFaseId
          );

        if (partidosError) {
          console.error(partidosError);

          throw new Error(
            "No se han podido cargar los partidos."
          );
        }

        /*
         * Buscar el partido que cae en
         * sábado o domingo seleccionado.
         */
        const partidoEncontrado =
          (partidosData ?? []).find(
            (item) => {
              const fecha =
                parseFechaPartido(
                  item.fecha
                );

              if (!fecha) {
                return false;
              }

              const sabado =
                weekend;

              const domingo =
                addDays(
                  weekend,
                  1
                );

              const esSabado =
                fecha.getFullYear() ===
                  sabado.getFullYear() &&
                fecha.getMonth() ===
                  sabado.getMonth() &&
                fecha.getDate() ===
                  sabado.getDate();

              const esDomingo =
                fecha.getFullYear() ===
                  domingo.getFullYear() &&
                fecha.getMonth() ===
                  domingo.getMonth() &&
                fecha.getDate() ===
                  domingo.getDate();

              return (
                esSabado ||
                esDomingo
              );
            }
          );

        setPartido(
          partidoEncontrado ?? null
        );
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "No se han podido cargar los datos."
        );
      } finally {
        setLoadingDatos(false);
      }
    }

    loadDatos();
  }, [
    selectedEquipoFase,
    selectedWeekend,
  ]);

  /*
   * Obtener disponibilidad de un jugador.
   *
   * Si no existe registro:
   * el jugador está disponible
   * todo el fin de semana.
   */
  function getDisponibilidad(
    jugadorId: number
  ): Disponibilidad {
    const fecha =
      selectedWeekend
        ? format(
            selectedWeekend,
            "yyyy-MM-dd"
          )
        : "";

    return (
      disponibilidades[
        jugadorId
      ] ?? {
        jugador_id:
          jugadorId,

        fecha_fin_de_semana:
          fecha,

        sabado_manana: true,
        sabado_tarde: true,
        domingo_manana: true,
        domingo_tarde: true,
      }
    );
  }

  /*
   * Calcular resumen de una franja.
   */
  function getResumen(
    momento: Momento
  ): ResumenMomento {
    let disponibles = 0;

    jugadores.forEach(
      (jugador) => {
        const disponibilidad =
          getDisponibilidad(
            jugador.id
          );

        if (
          disponibilidad[
            momento
          ]
        ) {
          disponibles++;
        }
      }
    );

    return {
      disponibles,
      noDisponibles:
        jugadores.length -
        disponibles,
      total:
        jugadores.length,
    };
  }

  function hayFaltaDePortero(
  momento: Momento | null
): boolean {
  if (!momento) {
    return false;
  }

  const porteros = jugadores.filter(
    (jugador) => jugador.esportero
  );

  if (porteros.length === 0) {
    return false;
  }

  return !porteros.some((portero) => {
    const disponibilidad =
      getDisponibilidad(portero.id);

    return disponibilidad[momento];
  });
}

  /*
   * Determinar en qué franja está
   * el partido.
   */
  function getMomentoPartido():
    | Momento
    | null {
    if (!partido) {
      return null;
    }

    const fecha =
      parseFechaPartido(
        partido.fecha
      );

    if (!fecha) {
      return null;
    }

    const horaTexto =
      partido.hora
        ?.trim()
        .replace(".", ":");

    const partes =
      horaTexto.split(":");

    const horas = Number(
      partes[0]
    );

    const minutos =
      Number(
        partes[1] ?? 0
      );

    if (
      Number.isNaN(horas)
    ) {
      return null;
    }

    const esSabado =
      fecha.getDay() === 6;

    const esDomingo =
      fecha.getDay() === 0;

    if (
      !esSabado &&
      !esDomingo
    ) {
      return null;
    }

    const tarde =
      horas >= 15;

    if (esSabado) {
      return tarde
        ? "sabado_tarde"
        : "sabado_manana";
    }

    return tarde
      ? "domingo_tarde"
      : "domingo_manana";
  }

  /*
   * Obtener nombre de la franja.
   */
  function getNombreMomento(
    momento: Momento
  ) {
    switch (momento) {
      case "sabado_manana":
        return "Sábado mañana";

      case "sabado_tarde":
        return "Sábado tarde";

      case "domingo_manana":
        return "Domingo mañana";

      case "domingo_tarde":
        return "Domingo tarde";
    }
  }

  /*
   * Fecha mínima del selector.
   */
  const fechaMinima =
    format(
      inicio,
      "yyyy-MM-dd"
    );

  /*
   * Fecha máxima del selector.
   */
  const fechaMaxima =
    format(
      fin,
      "yyyy-MM-dd"
    );

  const momentoPartido =
    getMomentoPartido();

  const faltaPortero = hayFaltaDePortero(momentoPartido);

  /*
   * Loading inicial.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-gray-500">
            Cargando equipos asignados...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-10">
      <div className="mx-auto max-w-2xl">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() =>
            router.push("/socios")
          }
          className="
            mb-4
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
        </button>

        {/* CABECERA */}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Disponibilidad por equipo
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consulta la disponibilidad de los
            jugadores de tus equipos.
          </p>
        </div>

        {/* SIN EQUIPOS */}

        {equiposAsignados.length === 0 ? (
          <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="text-3xl">
              📋
            </div>

            <h2 className="mt-3 text-lg font-bold text-gray-900">
              No tienes equipos asignados
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Actualmente no tienes ningún
              equipo o fase asignado como
              entrenador o delegado.
            </p>
          </section>
        ) : (
          <>
            {/* SELECTORES */}

<section className="rounded-2xl bg-white p-4 shadow-sm">

  <div className="flex items-center justify-between gap-3">

<div className="min-w-0">

  <p className="text-xs font-medium text-gray-500">
    Consulta
  </p>

  <p className="mt-1 truncate text-base font-bold text-gray-900">
    {equiposAsignados.find(
      (equipo) =>
        equipo.equipoFaseId === selectedEquipoFase
    )?.nombreEquipo ?? "Equipo"}
  </p>

  {selectedWeekend && (
    <p className="mt-1 text-sm capitalize text-gray-500">
      {format(
        selectedWeekend,
        "dd/MM",
        {
          locale: es,
        }
      )}
      {" - "}
      {format(
        addDays(selectedWeekend, 1),
        "dd/MM",
        {
          locale: es,
        }
      )}
    </p>
  )}

</div>

<button
  type="button"
  onClick={() =>
    setMostrarFiltros(!mostrarFiltros)
  }
  className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700"
>
  {mostrarFiltros
    ? "Cerrar"
    : "Cambiar"}
</button>


  </div>

  {mostrarFiltros && ( <div className="mt-4 border-t border-gray-100 pt-4">

    {/* EQUIPO */}

    <div className="mb-4">

      <label
        htmlFor="equipo"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Equipo
      </label>

      <select
        id="equipo"
        value={
          selectedEquipoFase ?? ""
        }
        onChange={(e) =>
          setSelectedEquipoFase(
            Number(e.target.value)
          )
        }
        className="
          w-full
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          py-3
          text-base
          font-medium
          text-gray-900
          outline-none
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      >
        {equiposAsignados.map(
          (equipo) => (
            <option
              key={
                equipo.equipoFaseId
              }
              value={
                equipo.equipoFaseId
              }
            >
              {equipo.nombreEquipo}
            </option>
          )
        )}
      </select>

    </div>

    {/* FECHA */}

    <div>

      <label
        htmlFor="fecha"
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Fin de semana
      </label>

      <input
        id="fecha"
        type="date"
        min={fechaMinima}
        max={fechaMaxima}
        value={
          selectedWeekend
            ? format(
                selectedWeekend,
                "yyyy-MM-dd"
              )
            : ""
        }
        onChange={(e) =>
          handleDateChange(
            e.target.value
          )
        }
        className="
          w-full
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          py-3
          text-base
          font-medium
          text-gray-900
          outline-none
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-100
        "
      />

    </div>

  </div>

  )}

  </section>


            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* CARGANDO DATOS */}

            {loadingDatos && (
              <div className="mt-6 rounded-2xl bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500">
                  Cargando disponibilidad...
                </p>
              </div>
            )}

            {!loadingDatos &&
              !error &&
              selectedWeekend && (
                <>
                  {/* PARTIDO */}



<section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">

  <div className="mb-3 flex items-center justify-between gap-3">


<h2 className="text-lg font-bold text-gray-900">
  Partido
</h2>

{momentoPartido && (
  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
    {getNombreMomento(
      momentoPartido
    )}
  </span>
)}

  </div>

{partido ? ( <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">


  <div className="flex items-start justify-between gap-4">

    <div>

      <p className="text-lg font-bold text-blue-950">
        {partido.fecha} {" - "}
         <span className="mt-1 text-sm font-semibold text-blue-800">
          {partido.hora}
        </span>
      </p>
      {faltaPortero && (
        <p className="text-sm font-bold text-red-700 text-left" >
          ⚠️ Falta portero
        </p>
        
      )}
    </div>

    {momentoPartido && (
      <div className="text-right">

        <p className="text-2xl font-bold text-blue-950">
          {
            getResumen(
              momentoPartido
            ).disponibles
          }

          <span className="text-sm font-medium text-blue-700">
            {" / "}
            {
              getResumen(
                momentoPartido
              ).total
            }
          </span>
        </p>

        

{/* 
        <p className="text-[11px] font-medium text-blue-700">
          disponibles
        </p>
*/}

      </div>
    )}

  </div>
 
{/* 
  {momentoPartido && (
    <div className="mt-3 border-t border-blue-200 pt-3">

      <div className="flex items-center justify-between gap-3">

        <span className="text-sm font-medium text-blue-800">
          Franja del partido
        </span>

        <span className="text-sm font-bold text-blue-950">
          {getNombreMomento(
            momentoPartido
          )}
        </span>

      </div>

    </div>
  )}
*/}

</div>

) : ( <div className="rounded-xl bg-gray-50 p-4">

  <p className="text-sm text-gray-500">
    No hay ningún partido registrado
    para este equipo en este fin de
    semana.
  </p>

</div>

)}

</section>


                  {/* RESUMEN */}

                  <section className="mt-6">

                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        Disponibilidad
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {jugadores.length}{" "}
                        {jugadores.length === 1
                          ? "jugador"
                          : "jugadores"}{" "}
                        en el equipo
                      </p>
                    </div>

                    {/* SÁBADO */}

                    <h3 className="mb-2 text-sm font-bold text-gray-700">
                      Sábado
                    </h3>

                    <div className="grid grid-cols-2 gap-3">

                      <ResumenFranja
                        titulo="Mañana"
                        resumen={getResumen(
                          "sabado_manana"
                        )}
                        partido={
                          momentoPartido ===
                          "sabado_manana"
                        }
                      />

                      <ResumenFranja
                        titulo="Tarde"
                        resumen={getResumen(
                          "sabado_tarde"
                        )}
                        partido={
                          momentoPartido ===
                          "sabado_tarde"
                        }
                      />

                    </div>

                    {/* DOMINGO */}

                    <h3 className="mb-2 mt-5 text-sm font-bold text-gray-700">
                      Domingo
                    </h3>

                    <div className="grid grid-cols-2 gap-3">

                      <ResumenFranja
                        titulo="Mañana"
                        resumen={getResumen(
                          "domingo_manana"
                        )}
                        partido={
                          momentoPartido ===
                          "domingo_manana"
                        }
                      />

                      <ResumenFranja
                        titulo="Tarde"
                        resumen={getResumen(
                          "domingo_tarde"
                        )}
                        partido={
                          momentoPartido ===
                          "domingo_tarde"
                        }
                      />

                    </div>
                  </section>

                  {/* DETALLE DE JUGADORES */}


<section className="mt-6">

<button
type="button"
onClick={() =>
setMostrarJugadores(
!mostrarJugadores
)
}
className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm"

>

<div>

  <h2 className="text-lg font-bold text-gray-900">
    Jugadores
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    {jugadores.length}{" "}
    {jugadores.length === 1
      ? "jugador"
      : "jugadores"}{" "}
    · Ver detalle de disponibilidad
  </p>

</div>

<span
  className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600"
  aria-hidden="true"
>
  {mostrarJugadores
    ? "−"
    : "+"}
</span>

  </button>

{mostrarJugadores && ( <div className="mt-3">

  {jugadores.length === 0 ? (
    <div className="rounded-2xl bg-white p-5 text-center shadow-sm">

      <p className="text-sm text-gray-500">
        Este equipo no tiene
        jugadores asignados.
      </p>

    </div>
  ) : (
    <div className="space-y-3">

      {jugadores.map(
        (jugador) => {
          const disponibilidad =
            getDisponibilidad(
              jugador.id
            );

          return (
            <JugadorDisponibilidad
              key={jugador.id}
              jugador={jugador}
              disponibilidad={
                disponibilidad
              }
            />
          );
        }
      )}

    </div>
  )}

</div>

)}

</section>

                </>
              )}
          </>
        )}
      </div>
    </main>
  );
}

/*
 * Componente de una franja.
 */
function ResumenFranja({
  titulo,
  resumen,
  partido,
}: {
  titulo: string;
  resumen: ResumenMomento;
  partido: boolean;
}) {
  let colores =
    "border-green-200 bg-green-50";

  if (
    resumen.total > 0 &&
    resumen.disponibles <=
      resumen.total / 2
  ) {
    colores =
      "border-red-200 bg-red-50";
  } else if (
    resumen.total > 0 &&
    resumen.disponibles <
      resumen.total
  ) {
    colores =
      "border-yellow-200 bg-yellow-50";
  }

  return (
    <div
      className={`
        rounded-2xl
        border
        p-3
        ${colores}
        ${
          partido
            ? "ring-2 ring-blue-500 ring-offset-1"
            : ""
        }
      `}
    >
      <div className="flex items-center justify-between gap-1">

        <h3 className="text-sm font-bold text-gray-900">
          {titulo}
        </h3>

        {partido && (
          <span className="text-[10px] font-bold uppercase text-blue-700">
            Partido ⚑
          </span>
        )}
      </div>

      <p className="mt-2 text-xl font-bold text-gray-900">
        {resumen.disponibles}

        <span className="text-sm font-medium text-gray-500">
          {" "}
          / {resumen.total} disponibles
        </span>
      </p>
    </div>
  );
}

/*
 * Detalle de un jugador.
 */
function JugadorDisponibilidad({
  jugador,
  disponibilidad,
}: {
  jugador: Jugador;
  disponibilidad: Disponibilidad;
}) {
  const nombreCompleto =
    [jugador.nombre, jugador.apellidos]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">

      <div className="mb-3 flex items-center justify-between gap-3">

        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">
            {nombreCompleto ||
              `Jugador ${jugador.id}`}
          </p>

          {jugador.esportero && (
            <p className="text-xs font-medium text-blue-600">
              Portero
            </p>
          )}
        </div>

      </div>

      <div className="grid grid-cols-2 gap-2">

        <EstadoDisponibilidad
          titulo="Sáb. mañana"
          disponible={
            disponibilidad.sabado_manana
          }
        />

        <EstadoDisponibilidad
          titulo="Sáb. tarde"
          disponible={
            disponibilidad.sabado_tarde
          }
        />

        <EstadoDisponibilidad
          titulo="Dom. mañana"
          disponible={
            disponibilidad.domingo_manana
          }
        />

        <EstadoDisponibilidad
          titulo="Dom. tarde"
          disponible={
            disponibilidad.domingo_tarde
          }
        />

      </div>
    </div>
  );
}

/*
 * Estado individual de disponibilidad.
 */
function EstadoDisponibilidad({
  titulo,
  disponible,
}: {
  titulo: string;
  disponible: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        px-3
        py-2
        ${
          disponible
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }
      `}
    >
      <p className="text-[11px] font-medium text-gray-500">
        {titulo}
      </p>

      <p
        className={`
          mt-1
          text-sm
          font-bold
          ${
            disponible
              ? "text-green-700"
              : "text-red-700"
          }
        `}
      >
        {disponible
          ? "✓ Disponible"
          : "✕ No disponible"}
      </p>
    </div>
  );
}
