"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  dorsal: number | null;
  activo: boolean;
  esportero: boolean;
};

type Temporada = {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
};

type Equipo = {
  id: number;
  nombre: string;
  categoria: string | null;
};

type EquipoFase = {
  id: number;
  idequipo: number;
  idtemporada: number;
  fase: number;
  liga: string | null;
  grupo: string | null;
  subgrupo: string | null;
  viva: boolean;
};

type JugadorEquipoFase = {
  jugador_id: number;
  equipo_fase_id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type PadreJugador = {
  jugador_id: number;
  usuario_id: string;
};

type PerfilUsuario = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
};

type JugadorListado = Jugador & {
  asignaciones: {
    equipoFase: EquipoFase;
    equipo: Equipo | null;
  }[];

  tutores: PerfilUsuario[];
};

export default function JugadoresPage() {
  const [jugadores, setJugadores] = useState<JugadorListado[]>([]);

  const [temporada, setTemporada] =
    useState<Temporada | null>(null);

  const [equipos, setEquipos] =
    useState<Equipo[]>([]);

  const [equiposFase, setEquiposFase] =
    useState<EquipoFase[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEquipo, setFiltroEquipo] =
    useState("todos");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      setError("");

      try {
        /*
         * TEMPORADA ACTIVA
         */

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
          throw new Error(
            "No existe una temporada activa."
          );
        }

        setTemporada(temporadaData);


        /*
         * EQUIPOS
         */

        const {
          data: equiposData,
          error: equiposError,
        } = await supabase
          .from("equipo")
          .select(
            "id, nombre, categoria"
          )
          .order("orden_categoria")
          .order("nombre");

        if (equiposError) {
          throw equiposError;
        }

        setEquipos(equiposData ?? []);


        /*
         * FASES DE LA TEMPORADA ACTIVA
         */

        const {
          data: fasesData,
          error: fasesError,
        } = await supabase
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
              viva
            `
          )
          .eq(
            "idtemporada",
            temporadaData.id
          )
          .order("fase");

        if (fasesError) {
          throw fasesError;
        }

        setEquiposFase(fasesData ?? []);


        /*
         * JUGADORES
         */

        const {
          data: jugadoresData,
          error: jugadoresError,
        } = await supabase
          .from("jugadores")
          .select(
            `
              id,
              nombre,
              apellidos,
              fecha_nacimiento,
              dorsal,
              activo,
              esportero
            `
          )
          .order("apellidos")
          .order("nombre");

        if (jugadoresError) {
          throw jugadoresError;
        }


        /*
         * ASIGNACIONES JUGADOR → EQUIPO FASE
         */

        const {
          data: asignacionesData,
          error: asignacionesError,
        } = await supabase
          .from("jugador_equipo_fase")
          .select(
            `
              jugador_id,
              equipo_fase_id,
              fecha_inicio,
              fecha_fin
            `
          );

        if (asignacionesError) {
          throw asignacionesError;
        }


        /*
         * TUTORES
         */

        const {
          data: padresData,
          error: padresError,
        } = await supabase
          .from("padre_jugador")
          .select(
            `
              jugador_id,
              usuario_id
            `
          );

        if (padresError) {
          throw padresError;
        }


        /*
         * USUARIOS DE LOS TUTORES
         */

        const usuarioIds = [
          ...new Set(
            (padresData ?? []).map(
              (item) => item.usuario_id
            )
          ),
        ];

        let perfiles: PerfilUsuario[] = [];

        if (usuarioIds.length > 0) {
          const {
            data: perfilesData,
            error: perfilesError,
          } = await supabase
            .from("perfil_usuario")
            .select(
              `
                id,
                nombre,
                apellidos
              `
            )
            .in("id", usuarioIds);

          if (perfilesError) {
            throw perfilesError;
          }

          perfiles = perfilesData ?? [];
        }


        /*
         * CONSTRUIR LISTADO
         */

        const resultado: JugadorListado[] =
          (jugadoresData ?? []).map(
            (jugador) => {

              const asignaciones =
                (asignacionesData ?? [])
                  .filter(
                    (item) =>
                      item.jugador_id ===
                      jugador.id
                  )
                  .map((asignacion) => {

                    const equipoFase =
                      (fasesData ?? []).find(
                        (fase) =>
                          fase.id ===
                          asignacion.equipo_fase_id
                      );

                    if (!equipoFase) {
                      return null;
                    }

                    const equipo =
                      (equiposData ?? []).find(
                        (item) =>
                          item.id ===
                          equipoFase.idequipo
                      ) ?? null;

                    return {
                      equipoFase,
                      equipo,
                    };
                  })
                  .filter(
                    (
                      item
                    ): item is {
                      equipoFase: EquipoFase;
                      equipo: Equipo | null;
                    } => item !== null
                  );

              const tutores =
                (padresData ?? [])
                  .filter(
                    (item) =>
                      item.jugador_id ===
                      jugador.id
                  )
                  .map((relacion) =>
                    perfiles.find(
                      (perfil) =>
                        perfil.id ===
                        relacion.usuario_id
                    )
                  )
                  .filter(
                    (
                      perfil
                    ): perfil is PerfilUsuario =>
                      Boolean(perfil)
                  );

              return {
                ...jugador,
                asignaciones,
                tutores,
              };
            }
          );

        setJugadores(resultado);
      } catch (error) {
        console.error(error);

        setError(
          "No se han podido cargar los jugadores."
        );
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);


  /*
   * EQUIPOS CON FASE EN LA TEMPORADA ACTIVA
   */

  const opcionesFiltro = useMemo(() => {
    return equiposFase
      .map((fase) => {

        const equipo =
          equipos.find(
            (item) =>
              item.id === fase.idequipo
          );

        if (!equipo) {
          return null;
        }

        return {
          id: fase.id,
          nombre: equipo.nombre,
          fase: fase.fase,
        };
      })
      .filter(
        (
          item
        ): item is {
          id: number;
          nombre: string;
          fase: number;
        } => item !== null
      );
  }, [equiposFase, equipos]);


  /*
   * FILTRAR JUGADORES
   */

  const jugadoresFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return jugadores.filter(
        (jugador) => {

          /*
           * BÚSQUEDA
           */

          const nombreCompleto =
            `${jugador.nombre} ${jugador.apellidos}`
              .toLowerCase();

          const coincideBusqueda =
            !texto ||
            nombreCompleto.includes(
              texto
            );


          /*
           * FILTRO EQUIPO / FASE
           */

          const coincideEquipo =
            filtroEquipo === "todos" ||
            jugador.asignaciones.some(
              (asignacion) =>
                String(
                  asignacion.equipoFase.id
                ) === filtroEquipo
            );

          return (
            coincideBusqueda &&
            coincideEquipo
          );
        }
      );
    }, [
      jugadores,
      busqueda,
      filtroEquipo,
    ]);


  /*
   * ESTADO DE CARGA
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-sm text-gray-500">
            Cargando jugadores...
          </p>
        </div>
      </main>
    );
  }


  /*
   * ERROR
   */

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
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
            ← Volver a administración
          </Link>

          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-10">

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

        <div className="mb-6">

          <div className="flex items-start justify-between gap-4">

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Jugadores
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Gestiona los jugadores registrados.
              </p>
            </div>

            <Link
              href="/admin/jugadores/nuevo"
              className="
                shrink-0
                rounded-xl
                bg-blue-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              + Nuevo jugador
            </Link>

          </div>

        </div>


        {/* FILTROS */}

        <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">

          <div className="space-y-3">

            {/* BUSCAR */}

            <div>

              <label
                htmlFor="buscar"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Buscar jugador
              </label>

              <input
                id="buscar"
                type="search"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
                placeholder="Nombre o apellidos..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-base
                  text-gray-900
                  outline-none
                  transition
                  placeholder:text-gray-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>


            {/* EQUIPO / FASE */}

            <div>

              <label
                htmlFor="equipo"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Equipo / fase
              </label>

              <select
                id="equipo"
                value={filtroEquipo}
                onChange={(e) =>
                  setFiltroEquipo(
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
                  text-gray-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >

                <option value="todos">
                  Todos
                </option>

                {opcionesFiltro.map(
                  (opcion) => (
                    <option
                      key={opcion.id}
                      value={opcion.id}
                    >
                      {opcion.nombre}
                      {" · Fase "}
                      {opcion.fase}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </section>


        {/* TEMPORADA */}

        {temporada && (
          <div className="mb-4 flex items-center justify-between">

            <p className="text-sm font-semibold text-gray-700">
              {temporada.nombre}
            </p>

            <p className="text-sm text-gray-500">
              {jugadoresFiltrados.length}{" "}
              {jugadoresFiltrados.length === 1
                ? "jugador"
                : "jugadores"}
            </p>

          </div>
        )}


        {/* SIN RESULTADOS */}

        {jugadoresFiltrados.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="mb-2 text-3xl">
              👤
            </div>

            <h2 className="font-bold text-gray-900">
              No hay jugadores
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              No se han encontrado jugadores
              con los filtros seleccionados.
            </p>

          </div>
        )}


        {/* LISTADO */}

        <div className="space-y-3">

          {jugadoresFiltrados.map(
            (jugador) => (

              <Link
                key={jugador.id}
                href={`/admin/jugadores/${jugador.id}`}
                className="
                  block
                  rounded-2xl
                  bg-white
                  p-4
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                  active:scale-[0.99]
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    {/* NOMBRE */}

                    <div className="flex items-center gap-2">

                      <h2 className="truncate text-base font-bold text-gray-900">
                        {jugador.nombre}{" "}
                        {jugador.apellidos}
                      </h2>

                      {!jugador.activo && (
                        <span
                          className="
                            shrink-0
                            rounded-full
                            bg-gray-100
                            px-2
                            py-0.5
                            text-xs
                            font-semibold
                            text-gray-500
                          "
                        >
                          Inactivo
                        </span>
                      )}

                    </div>


                    {/* EQUIPOS */}

                    {jugador.asignaciones.length >
                    0 ? (
                      <div className="mt-1 space-y-0.5">

                        {jugador.asignaciones.map(
                          (asignacion) => (

                            <p
                              key={
                                asignacion
                                  .equipoFase
                                  .id
                              }
                              className="text-sm text-gray-500"
                            >
                              {asignacion.equipo
                                ?.nombre ??
                                "Equipo"}
                              {" · Fase "}
                              {
                                asignacion
                                  .equipoFase
                                  .fase
                              }
                            </p>

                          )
                        )}

                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">
                        Sin equipo asignado
                      </p>
                    )}


                    {/* DATOS */}

                    <div className="mt-2 flex flex-wrap items-center gap-2">

                      {jugador.dorsal !== null && (
                        <span className="text-xs font-medium text-gray-500">
                          Dorsal{" "}
                          {jugador.dorsal}
                        </span>
                      )}

                      {jugador.esportero && (
                        <span
                          className="
                            rounded-full
                            bg-blue-50
                            px-2
                            py-0.5
                            text-xs
                            font-semibold
                            text-blue-700
                          "
                        >
                          🧤 Portero
                        </span>
                      )}

                      <span className="text-xs font-medium text-gray-500">
                        👥{" "}
                        {jugador.tutores.length}{" "}
                        {jugador.tutores.length === 1
                          ? "tutor"
                          : "tutores"}
                      </span>

                    </div>

                  </div>


                  {/* FLECHA */}

                  <span className="shrink-0 pt-1 text-xl text-gray-300">
                    →
                  </span>

                </div>

              </Link>

            )
          )}

        </div>

      </div>

    </main>
  );
}
