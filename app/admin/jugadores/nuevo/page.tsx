"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Temporada = {
  id: number;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type Equipo = {
  id: number;
  nombre: string;
  grupo: string | null;
  categoria: string | null;
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

type PerfilUsuario = {
  id: string;
  nombre: string | null;
  apellidos: string | null;
};

export default function NuevoJugadorPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [temporada, setTemporada] = useState<Temporada | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equiposFase, setEquiposFase] = useState<EquipoFase[]>([]);
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);

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

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError(null);

      const [
        { data: temporadaData, error: temporadaError },
        { data: equiposData, error: equiposError },
        { data: usuariosData, error: usuariosError },
      ] = await Promise.all([
        supabase
          .from("temporada")
          .select("id, nombre, fecha_inicio, fecha_fin")
          .eq("activa", true)
          .order("fecha_inicio", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("equipo")
          .select(
            "id, nombre, grupo, categoria, orden_categoria"
          )
          .order("orden_categoria", { ascending: true })
          .order("nombre", { ascending: true }),

        supabase
          .from("perfil_usuario")
          .select("id, nombre, apellidos")
          .order("apellidos", { ascending: true })
          .order("nombre", { ascending: true }),
      ]);

      if (temporadaError) {
        throw new Error(temporadaError.message);
      }

      if (equiposError) {
        throw new Error(equiposError.message);
      }

      if (usuariosError) {
        throw new Error(usuariosError.message);
      }

      setTemporada(temporadaData);
      setEquipos(equiposData ?? []);
      setUsuarios(usuariosData ?? []);

      if (temporadaData) {
        const { data: fasesData, error: fasesError } = await supabase
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
          .order("fase", { ascending: true });

        if (fasesError) {
          throw new Error(fasesError.message);
        }

        setEquiposFase(fasesData ?? []);
      } else {
        setEquiposFase([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se han podido cargar los datos."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Combinamos equipo + equipo_fase para poder mostrar:
   *
   * Nombre del equipo
   * Fase
   */
  const equiposConFase = useMemo(() => {
    return equiposFase
      .map((fase) => {
        const equipo = equipos.find((e) => e.id === fase.idequipo);

        if (!equipo) {
          return null;
        }

        return {
          ...fase,
          equipo,
        };
      })
      .filter(
        (
          item
        ): item is EquipoFase & {
          equipo: Equipo;
        } => item !== null
      )
      .sort((a, b) => {
        const ordenA = a.equipo.orden_categoria ?? 999999;
        const ordenB = b.equipo.orden_categoria ?? 999999;

        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }

        const nombreA = a.equipo.nombre.toLowerCase();
        const nombreB = b.equipo.nombre.toLowerCase();

        if (nombreA !== nombreB) {
          return nombreA.localeCompare(nombreB);
        }

        return (a.fase ?? 0) - (b.fase ?? 0);
      });
  }, [equipos, equiposFase]);

  /*
   * EQUIPOS:
   *
   * Si no estamos buscando, no mostramos ningún resultado.
   * Solo aparecen resultados cuando el administrador escribe.
   */
  const equiposFiltrados = useMemo(() => {
    const texto = busquedaEquipo.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return equiposConFase.filter((item) => {
      const nombreEquipo = item.equipo.nombre.toLowerCase();

      const fase =
        item.fase !== null && item.fase !== undefined
          ? `fase ${item.fase}`
          : "";

      return (
        nombreEquipo.includes(texto) ||
        fase.includes(texto) ||
        String(item.fase ?? "").includes(texto)
      );
    });
  }, [equiposConFase, busquedaEquipo]);

  /*
   * TUTORES:
   *
   * Igual que equipos: sin búsqueda no mostramos ningún listado.
   */
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

  function toggleEquipo(equipoFaseId: number) {
    setEquiposSeleccionados((actuales) => {
      if (actuales.includes(equipoFaseId)) {
        return actuales.filter((id) => id !== equipoFaseId);
      }

      return [...actuales, equipoFaseId];
    });
  }

  function toggleTutor(usuarioId: string) {
    setTutoresSeleccionados((actuales) => {
      if (actuales.includes(usuarioId)) {
        return actuales.filter((id) => id !== usuarioId);
      }

      return [...actuales, usuarioId];
    });
  }

  function nombreEquipoFase(equipoFaseId: number) {
    const item = equiposConFase.find(
      (fase) => fase.id === equipoFaseId
    );

    if (!item) {
      return "Equipo no encontrado";
    }

    const faseTexto =
      item.fase !== null && item.fase !== undefined
        ? `Fase ${item.fase}`
        : "Sin fase";

    return `${item.equipo.nombre} · ${faseTexto}`;
  }

  function nombreTutor(usuarioId: string) {
    const usuario = usuarios.find(
      (item) => item.id === usuarioId
    );

    if (!usuario) {
      return "Usuario no encontrado";
    }

    return (
      `${usuario.nombre ?? ""} ${usuario.apellidos ?? ""}`.trim() ||
      "Sin nombre"
    );
  }

  async function guardarJugador() {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!apellidos.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError(null);

      /*
       * 1. Crear jugador
       */
      const { data: jugador, error: jugadorError } = await supabase
        .from("jugadores")
        .insert({
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          fecha_nacimiento: fechaNacimiento || null,
          dorsal: dorsal ? Number(dorsal) : null,
          activo,
          esportero: esPortero,
        })
        .select("id")
        .single();

      if (jugadorError) {
        throw new Error(jugadorError.message);
      }

      if (!jugador) {
        throw new Error("No se ha podido crear el jugador.");
      }

      /*
       * 2. Asignar equipos/fases
       */
      if (equiposSeleccionados.length > 0) {
        const asignaciones = equiposSeleccionados.map(
          (equipoFaseId) => {
            const equipoFase = equiposFase.find(
              (fase) => fase.id === equipoFaseId
            );

            return {
              jugador_id: jugador.id,
              equipo_fase_id: equipoFaseId,
              fecha_inicio:
                equipoFase?.fecha_inicio ??
                temporada?.fecha_inicio ??
                null,
              fecha_fin: equipoFase?.fecha_fin ?? null,
            };
          }
        );

        const { error: asignacionesError } = await supabase
          .from("jugador_equipo_fase")
          .insert(asignaciones);

        if (asignacionesError) {
          throw new Error(asignacionesError.message);
        }
      }

      /*
       * 3. Asignar padres/tutores
       */
      if (tutoresSeleccionados.length > 0) {
        const relacionesPadres = tutoresSeleccionados.map(
          (usuarioId) => ({
            usuario_id: usuarioId,
            jugador_id: jugador.id,
          })
        );

        const { error: padresError } = await supabase
          .from("padre_jugador")
          .insert(relacionesPadres);

        if (padresError) {
          throw new Error(padresError.message);
        }
      }

      /*
       * 4. Ir a la ficha del jugador
       */
      router.push(`/admin/jugadores/${jugador.id}`);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido guardar el jugador."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando datos...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        {/* VOLVER */}
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

        {/* CABECERA */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Nuevo jugador
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Añade los datos del jugador y sus equipos y tutores.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* ====================================================== */}
          {/* DATOS DEL JUGADOR */}
          {/* ====================================================== */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Datos del jugador
            </h2>

            <div className="space-y-4">
              {/* NOMBRE */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                  placeholder="Nombre"
                />
              </div>

              {/* APELLIDOS */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                  placeholder="Apellidos"
                />
              </div>

              {/* FECHA + DORSAL */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fecha de nacimiento
                  </label>

                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) =>
                      setFechaNacimiento(e.target.value)
                    }
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
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
                    placeholder="Número"
                  />
                </div>
              </div>

              {/* ACTIVO / PORTERO */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />

                  <span className="text-sm text-gray-700">
                    Jugador activo
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={esPortero}
                    onChange={(e) =>
                      setEsPortero(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />

                  <span className="text-sm text-gray-700">
                    Es portero
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* ====================================================== */}
          {/* EQUIPOS / FASES */}
          {/* ====================================================== */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Equipos / fases
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Busca y selecciona uno o varios equipos.
              </p>
            </div>

            {/* BUSCADOR */}
            <input
              type="search"
              value={busquedaEquipo}
              onChange={(e) =>
                setBusquedaEquipo(e.target.value)
              }
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
              placeholder="Buscar equipo o fase..."
            />

            {/* RESULTADOS DE BÚSQUEDA */}
            {busquedaEquipo.trim() && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                {equiposFiltrados.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No se han encontrado equipos o fases.
                  </div>
                ) : (
                  equiposFiltrados.map((item) => {
                    const seleccionado =
                      equiposSeleccionados.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleEquipo(item.id)}
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
                          disabled:bg-blue-50
                        "
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.equipo.nombre}
                          </p>

                          <p className="text-xs text-gray-500">
                            {item.fase !== null &&
                            item.fase !== undefined
                              ? `Fase ${item.fase}`
                              : "Sin fase"}
                          </p>
                        </div>

                        {seleccionado && (
                          <span className="text-xs font-medium text-blue-600">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* SELECCIONADOS */}
            {equiposSeleccionados.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Seleccionados
                </p>

                <div className="flex flex-wrap gap-2">
                  {equiposSeleccionados.map((equipoFaseId) => (
                    <button
                      key={equipoFaseId}
                      type="button"
                      onClick={() =>
                        toggleEquipo(equipoFaseId)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-blue-700
                        transition
                        hover:bg-blue-100
                      "
                    >
                      {nombreEquipoFase(equipoFaseId)}

                      <span className="text-blue-500">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ====================================================== */}
          {/* PADRES / TUTORES */}
          {/* ====================================================== */}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Padres / tutores
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Busca y selecciona uno o varios padres o tutores.
              </p>
            </div>

            {/* BUSCADOR */}
            <input
              type="search"
              value={busquedaTutor}
              onChange={(e) =>
                setBusquedaTutor(e.target.value)
              }
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
              placeholder="Buscar usuario..."
            />

            {/* RESULTADOS DE BÚSQUEDA */}
            {busquedaTutor.trim() && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                {tutoresFiltrados.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    No se han encontrado usuarios.
                  </div>
                ) : (
                  tutoresFiltrados.map((usuario) => {
                    const seleccionado =
                      tutoresSeleccionados.includes(
                        usuario.id
                      );

                    return (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() =>
                          toggleTutor(usuario.id)
                        }
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
                          disabled:bg-blue-50
                        "
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {nombreTutor(usuario.id)}
                        </span>

                        {seleccionado && (
                          <span className="text-xs font-medium text-blue-600">
                            Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* SELECCIONADOS */}
            {tutoresSeleccionados.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Seleccionados
                </p>

                <div className="flex flex-wrap gap-2">
                  {tutoresSeleccionados.map((usuarioId) => (
                    <button
                      key={usuarioId}
                      type="button"
                      onClick={() =>
                        toggleTutor(usuarioId)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-blue-700
                        transition
                        hover:bg-blue-100
                      "
                    >
                      {nombreTutor(usuarioId)}

                      <span className="text-blue-500">
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ====================================================== */}
          {/* GUARDAR */}
          {/* ====================================================== */}

          <button
            type="button"
            onClick={guardarJugador}
            disabled={guardando}
            className="
              w-full
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
              disabled:opacity-50
            "
          >
            {guardando ? "Guardando..." : "Crear jugador"}
          </button>
        </div>
      </div>
    </main>
  );
}
