"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type EquipoConFase = {
  equipo: Equipo;
  fase: EquipoFase;
};

type Usuario = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
};

type JugadorEquipoFase = {
  jugador_id: number;
  equipo_fase_id: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type PadreJugador = {
  usuario_id: string;
  jugador_id: number;
};

export default function EditarJugadorPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const jugadorId = Number(params.id);

  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [temporada, setTemporada] = useState<Temporada | null>(null);

  const [equiposConFase, setEquiposConFase] = useState<EquipoConFase[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [asignaciones, setAsignaciones] = useState<JugadorEquipoFase[]>([]);
  const [padres, setPadres] = useState<PadreJugador[]>([]);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [activo, setActivo] = useState(true);
  const [esPortero, setEsPortero] = useState(false);

  const [equiposSeleccionados, setEquiposSeleccionados] = useState<number[]>(
    []
  );
  const [tutoresSeleccionados, setTutoresSeleccionados] = useState<string[]>(
    []
  );

  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [busquedaTutor, setBusquedaTutor] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jugadorId || Number.isNaN(jugadorId)) {
      setError("Jugador no válido.");
      setCargando(false);
      return;
    }

    cargarDatos();
  }, [jugadorId]);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      jugadorResult,
      temporadaResult,
      equiposResult,
      usuariosResult,
      asignacionesResult,
      padresResult,
    ] = await Promise.all([
      supabase
        .from("jugadores")
        .select(
          "id, nombre, apellidos, fecha_nacimiento, dorsal, activo, esportero"
        )
        .eq("id", jugadorId)
        .single(),

      supabase
        .from("temporada")
        .select("id, nombre, fecha_inicio, fecha_fin, activa")
        .eq("activa", true)
        .maybeSingle(),

      supabase
        .from("equipo")
        .select(
          "id, nombre, grupo, liga, etiqueta, categoria, subgrup, orden_categoria"
        )
        .order("orden_categoria", { ascending: true, nullsFirst: false })
        .order("nombre", { ascending: true }),

      supabase
        .from("perfil_usuario")
        .select("id, nombre, apellidos")
        .order("nombre", { ascending: true }),

      supabase
        .from("jugador_equipo_fase")
        .select("jugador_id, equipo_fase_id, fecha_inicio, fecha_fin")
        .eq("jugador_id", jugadorId),

      supabase
        .from("padre_jugador")
        .select("usuario_id, jugador_id")
        .eq("jugador_id", jugadorId),
    ]);

    if (jugadorResult.error || !jugadorResult.data) {
      setError("No se ha podido cargar el jugador.");
      setCargando(false);
      return;
    }

    if (temporadaResult.error) {
      setError("No se ha podido cargar la temporada activa.");
      setCargando(false);
      return;
    }

    if (equiposResult.error) {
      setError("No se han podido cargar los equipos.");
      setCargando(false);
      return;
    }

    if (usuariosResult.error) {
      setError("No se han podido cargar los usuarios.");
      setCargando(false);
      return;
    }

    if (asignacionesResult.error) {
      setError("No se han podido cargar las asignaciones del jugador.");
      setCargando(false);
      return;
    }

    if (padresResult.error) {
      setError("No se han podido cargar los tutores del jugador.");
      setCargando(false);
      return;
    }

    const jugadorData = jugadorResult.data as Jugador;
    const temporadaData = temporadaResult.data as Temporada | null;
    const equiposData = (equiposResult.data ?? []) as Equipo[];
    const usuariosData = (usuariosResult.data ?? []) as Usuario[];
    const asignacionesData =
      (asignacionesResult.data ?? []) as JugadorEquipoFase[];
    const padresData = (padresResult.data ?? []) as PadreJugador[];

    setJugador(jugadorData);
    setTemporada(temporadaData);
    setUsuarios(usuariosData);
    setAsignaciones(asignacionesData);
    setPadres(padresData);

    setNombre(jugadorData.nombre ?? "");
    setApellidos(jugadorData.apellidos ?? "");
    setFechaNacimiento(jugadorData.fecha_nacimiento ?? "");
    setDorsal(
      jugadorData.dorsal !== null && jugadorData.dorsal !== undefined
        ? String(jugadorData.dorsal)
        : ""
    );
    setActivo(jugadorData.activo);
    setEsPortero(jugadorData.esportero);

    setTutoresSeleccionados(padresData.map((padre) => padre.usuario_id));

    if (temporadaData) {
      const { data: fasesData, error: fasesError } = await supabase
        .from("equipo_fase")
        .select(
          "id, idequipo, idtemporada, fase, liga, grupo, subgrupo, viva, fecha_inicio, fecha_fin"
        )
        .eq("idtemporada", temporadaData.id);

      if (fasesError) {
        setError("No se han podido cargar las fases de los equipos.");
        setCargando(false);
        return;
      }

      const fases = (fasesData ?? []) as EquipoFase[];

      const equiposMap = new Map(
        equiposData.map((equipo) => [equipo.id, equipo])
      );

      const equiposConFaseData = fases
        .map((fase) => {
          const equipo = equiposMap.get(fase.idequipo);

          if (!equipo) {
            return null;
          }

          return {
            equipo,
            fase,
          };
        })
        .filter(Boolean) as EquipoConFase[];

      equiposConFaseData.sort((a, b) => {
        const ordenA = a.equipo.orden_categoria ?? Number.MAX_SAFE_INTEGER;
        const ordenB = b.equipo.orden_categoria ?? Number.MAX_SAFE_INTEGER;

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        return a.equipo.nombre.localeCompare(b.equipo.nombre);
      });

      setEquiposConFase(equiposConFaseData);

      const fasesActivas = new Set(fases.map((fase) => fase.id));

      setEquiposSeleccionados(
        asignacionesData
          .filter((asignacion) =>
            fasesActivas.has(asignacion.equipo_fase_id)
          )
          .map((asignacion) => asignacion.equipo_fase_id)
      );
    }

    setCargando(false);
  }

  const equiposFiltrados = useMemo(() => {
    const texto = busquedaEquipo.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return equiposConFase.filter((item) => {
      const nombreEquipo = item.equipo.nombre.toLowerCase();

      const fase =
        item.fase.fase !== null && item.fase.fase !== undefined
          ? `fase ${item.fase.fase}`
          : "";

      return (
        nombreEquipo.includes(texto) ||
        fase.includes(texto) ||
        String(item.fase.fase ?? "").includes(texto)
      );
    });
  }, [equiposConFase, busquedaEquipo]);

  const tutoresFiltrados = useMemo(() => {
    const texto = busquedaTutor.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return usuarios.filter((usuario) => {
      const nombreCompleto =
        `${usuario.nombre ?? ""} ${usuario.apellidos ?? ""}`.toLowerCase();

      return nombreCompleto.includes(texto);
    });
  }, [usuarios, busquedaTutor]);

  function agregarEquipo(equipoFaseId: number) {
    setEquiposSeleccionados((actuales) => {
      if (actuales.includes(equipoFaseId)) {
        return actuales;
      }

      return [...actuales, equipoFaseId];
    });

    setBusquedaEquipo("");
  }

  function quitarEquipo(equipoFaseId: number) {
    setEquiposSeleccionados((actuales) =>
      actuales.filter((id) => id !== equipoFaseId)
    );
  }

  function agregarTutor(usuarioId: string) {
    setTutoresSeleccionados((actuales) => {
      if (actuales.includes(usuarioId)) {
        return actuales;
      }

      return [...actuales, usuarioId];
    });

    setBusquedaTutor("");
  }

  function quitarTutor(usuarioId: string) {
    setTutoresSeleccionados((actuales) =>
      actuales.filter((id) => id !== usuarioId)
    );
  }

  function nombreEquipoFase(equipoFaseId: number) {
    const item = equiposConFase.find(
      (equipo) => equipo.fase.id === equipoFaseId
    );

    if (!item) {
      return `Equipo/fase #${equipoFaseId}`;
    }

    return `${item.equipo.nombre} · Fase ${item.fase.fase}`;
  }

  function nombreTutor(usuarioId: string) {
    const usuario = usuarios.find((item) => item.id === usuarioId);

    if (!usuario) {
      return "Usuario";
    }

    return `${usuario.nombre ?? ""} ${usuario.apellidos ?? ""}`.trim();
  }

  async function guardar() {
    setError("");

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!apellidos.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }

    if (!jugador) {
      setError("No se ha podido cargar el jugador.");
      return;
    }

    setGuardando(true);

    try {
      const { error: jugadorError } = await supabase
        .from("jugadores")
        .update({
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          fecha_nacimiento: fechaNacimiento || null,
          dorsal: dorsal ? Number(dorsal) : null,
          activo,
          esportero: esPortero,
        })
        .eq("id", jugador.id);

      if (jugadorError) {
        throw new Error(jugadorError.message);
      }

      /*
       * TUTORES
       *
       * Calculamos qué relaciones hay que eliminar y cuáles hay que añadir.
       * De esta forma no hacemos un delete-all innecesario.
       */
      const tutoresActuales = padres.map((padre) => padre.usuario_id);

      const tutoresAEliminar = tutoresActuales.filter(
        (usuarioId) => !tutoresSeleccionados.includes(usuarioId)
      );

      const tutoresAAgregar = tutoresSeleccionados.filter(
        (usuarioId) => !tutoresActuales.includes(usuarioId)
      );

      if (tutoresAEliminar.length > 0) {
        const { error: eliminarPadresError } = await supabase
          .from("padre_jugador")
          .delete()
          .eq("jugador_id", jugador.id)
          .in("usuario_id", tutoresAEliminar);

        if (eliminarPadresError) {
          throw new Error(eliminarPadresError.message);
        }
      }

      if (tutoresAAgregar.length > 0) {
        const nuevasRelaciones = tutoresAAgregar.map((usuarioId) => ({
          usuario_id: usuarioId,
          jugador_id: jugador.id,
        }));

        const { error: agregarPadresError } = await supabase
          .from("padre_jugador")
          .insert(nuevasRelaciones);

        if (agregarPadresError) {
          throw new Error(agregarPadresError.message);
        }
      }

      /*
       * EQUIPOS / FASES
       *
       * Solo modificamos las asignaciones pertenecientes a la temporada
       * activa. Las asignaciones de temporadas anteriores permanecen intactas.
       */
      if (temporada) {
        const fasesTemporadaActiva = equiposConFase.map(
          (item) => item.fase.id
        );

        const asignacionesTemporadaActiva = asignaciones.filter((asignacion) =>
          fasesTemporadaActiva.includes(asignacion.equipo_fase_id)
        );

        const asignacionesActualesIds = asignacionesTemporadaActiva.map(
          (asignacion) => asignacion.equipo_fase_id
        );

        const asignacionesAEliminar = asignacionesActualesIds.filter(
          (equipoFaseId) => !equiposSeleccionados.includes(equipoFaseId)
        );

        const asignacionesAAgregar = equiposSeleccionados.filter(
          (equipoFaseId) => !asignacionesActualesIds.includes(equipoFaseId)
        );

        if (asignacionesAEliminar.length > 0) {
          const { error: eliminarEquiposError } = await supabase
            .from("jugador_equipo_fase")
            .delete()
            .eq("jugador_id", jugador.id)
            .in("equipo_fase_id", asignacionesAEliminar);

          if (eliminarEquiposError) {
            throw new Error(eliminarEquiposError.message);
          }
        }

        if (asignacionesAAgregar.length > 0) {
          const nuevasAsignaciones = asignacionesAAgregar.map(
            (equipoFaseId) => {
              const equipoFase = equiposConFase.find(
                (item) => item.fase.id === equipoFaseId
              )?.fase;

              return {
                jugador_id: jugador.id,
                equipo_fase_id: equipoFaseId,
                fecha_inicio:
                  equipoFase?.fecha_inicio ??
                  temporada.fecha_inicio ??
                  null,
                fecha_fin: equipoFase?.fecha_fin ?? null,
              };
            }
          );

          const { error: agregarEquiposError } = await supabase
            .from("jugador_equipo_fase")
            .insert(nuevasAsignaciones);

          if (agregarEquiposError) {
            throw new Error(agregarEquiposError.message);
          }
        }
      }

      router.push("/admin/jugadores");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error al guardar."
      );
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/jugadores"
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
            ← Volver a jugadores
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando jugador...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!jugador) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/jugadores"
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
            ← Volver a jugadores
          </Link>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-red-600">
              {error || "No se ha encontrado el jugador."}
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
          href={"/admin/jugadores/"}
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
          ← Volver a jugadores
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar jugador
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Modifica los datos y las asignaciones de {jugador.nombre}{" "}
            {jugador.apellidos}.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* DATOS PERSONALES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Datos del jugador
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Apellidos
                </label>

                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Fecha de nacimiento
                </label>

                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Dorsal
                </label>

                <input
                  type="number"
                  min="0"
                  value={dorsal}
                  onChange={(e) => setDorsal(e.target.value)}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Jugador activo
                </label>

                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={esPortero}
                    onChange={(e) => setEsPortero(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  🧤 Es portero
                </label>
              </div>
            </div>
          </section>

          {/* EQUIPOS / FASES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Equipos / fases
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              {temporada
                ? `Temporada activa: ${temporada.nombre}`
                : "No hay una temporada activa."}
            </p>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Buscar equipo o fase
              </label>

              <input
                type="text"
                value={busquedaEquipo}
                onChange={(e) => setBusquedaEquipo(e.target.value)}
                placeholder="Escribe para buscar..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            {busquedaEquipo.trim() && (
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {equiposFiltrados.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No se han encontrado equipos o fases.
                  </div>
                ) : (
                  equiposFiltrados.map((item) => {
                    const seleccionado = equiposSeleccionados.includes(
                      item.fase.id
                    );

                    return (
                      <button
                        key={item.fase.id}
                        type="button"
                        onClick={() => agregarEquipo(item.fase.id)}
                        disabled={seleccionado}
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          border-b
                          border-gray-100
                          px-4
                          py-3
                          text-left
                          last:border-b-0
                          hover:bg-gray-50
                          disabled:cursor-default
                          disabled:bg-gray-50
                        "
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {item.equipo.nombre} · Fase {item.fase.fase}
                        </span>

                        {seleccionado && (
                          <span className="ml-3 shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Seleccionados
              </p>

              {equiposSeleccionados.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Ningún equipo/fase seleccionado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {equiposSeleccionados.map((equipoFaseId) => (
                    <div
                      key={equipoFaseId}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        bg-blue-50
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-blue-800
                      "
                    >
                      <span>{nombreEquipoFase(equipoFaseId)}</span>

                      <button
                        type="button"
                        onClick={() => quitarEquipo(equipoFaseId)}
                        className="
                          font-bold
                          text-blue-500
                          transition
                          hover:text-blue-800
                        "
                        aria-label={`Quitar ${nombreEquipoFase(
                          equipoFaseId
                        )}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* TUTORES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-gray-900">
              Padres / tutores
            </h2>

            <p className="mb-4 text-sm text-gray-500">
              Busca un usuario para añadirlo como tutor.
            </p>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Buscar tutor
              </label>

              <input
                type="text"
                value={busquedaTutor}
                onChange={(e) => setBusquedaTutor(e.target.value)}
                placeholder="Escribe un nombre o apellido..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            {busquedaTutor.trim() && (
              <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {tutoresFiltrados.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No se han encontrado usuarios.
                  </div>
                ) : (
                  tutoresFiltrados.map((usuario) => {
                    const seleccionado = tutoresSeleccionados.includes(
                      usuario.id
                    );

                    return (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() => agregarTutor(usuario.id)}
                        disabled={seleccionado}
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          border-b
                          border-gray-100
                          px-4
                          py-3
                          text-left
                          last:border-b-0
                          hover:bg-gray-50
                          disabled:cursor-default
                          disabled:bg-gray-50
                        "
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {`${usuario.nombre ?? ""} ${
                            usuario.apellidos ?? ""
                          }`.trim()}
                        </span>

                        {seleccionado && (
                          <span className="ml-3 shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Seleccionados
              </p>

              {tutoresSeleccionados.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Ningún tutor seleccionado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tutoresSeleccionados.map((usuarioId) => (
                    <div
                      key={usuarioId}
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        bg-blue-50
                        px-3
                        py-2
                        text-sm
                        font-medium
                        text-blue-800
                      "
                    >
                      <span>{nombreTutor(usuarioId)}</span>

                      <button
                        type="button"
                        onClick={() => quitarTutor(usuarioId)}
                        className="
                          font-bold
                          text-blue-500
                          transition
                          hover:text-blue-800
                        "
                        aria-label={`Quitar tutor ${nombreTutor(
                          usuarioId
                        )}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ACCIONES */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="
                flex-1
                rounded-xl
                bg-blue-600
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>

            <Link
              href={`/admin/jugadores/${jugador.id}`}
              className="
                flex-1
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
                text-center
                text-sm
                font-semibold
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
              "
            >
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
