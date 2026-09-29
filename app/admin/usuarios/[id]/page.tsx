"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  fecha_inicio: string | null;
  fecha_fin: string | null;
  viva: boolean;
};

type UsuarioEquipoFase = {
  usuario_id: string;
  equipo_fase_id: number;
  rol: string | null;
};

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
};

type PadreJugador = {
  usuario_id: string;
  jugador_id: number;
};

type EquipoFaseConEquipo = EquipoFase & {
  equipo: Equipo;
};

type AsignacionEquipoFase = {
  equipo_fase_id: number;
  rol: string | null;
};

const ROLES_DISPONIBLES = [
  {
    valor: "admin",
    nombre: "Administrador",
  },
  {
    valor: "padre",
    nombre: "Tutor",
  },
  {
    valor: "entrenador",
    nombre: "Entrenador",
  },
  {
    valor: "delegado",
    nombre: "Delegado",
  },
];

const ROLES_EQUIPO = [
  {
    valor: "entrenador",
    nombre: "Entrenador",
  },
  {
    valor: "delegado",
    nombre: "Delegado",
  },
];

export default function UsuarioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const usuarioId = String(params.id);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [temporada, setTemporada] = useState<Temporada | null>(null);
  const [equiposFases, setEquiposFases] = useState<
    EquipoFaseConEquipo[]
  >([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  const [rolesIniciales, setRolesIniciales] = useState<string[]>([]);
  const [jugadoresIniciales, setJugadoresIniciales] = useState<number[]>(
    []
  );

  const [asignacionesIniciales, setAsignacionesIniciales] = useState<
    AsignacionEquipoFase[]
  >([]);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");

  const [roles, setRoles] = useState<string[]>([]);
  const [nuevoRol, setNuevoRol] = useState("");

  const [asignacionesEquipoFase, setAsignacionesEquipoFase] = useState<
    AsignacionEquipoFase[]
  >([]);

  const [seleccionRolEquipo, setSeleccionRolEquipo] = useState("");

  const [seleccionadosJugadores, setSeleccionadosJugadores] = useState<
    number[]
  >([]);

  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [busquedaJugador, setBusquedaJugador] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [usuarioId]);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    const [
      { data: usuarioData, error: usuarioError },
      { data: temporadaData, error: temporadaError },
      { data: equiposData, error: equiposError },
      { data: fasesData, error: fasesError },
      { data: usuarioEquiposData, error: usuarioEquiposError },
      { data: rolesData, error: rolesError },
      { data: jugadoresData, error: jugadoresError },
      { data: padresData, error: padresError },
    ] = await Promise.all([
      supabase
        .from("perfil_usuario")
        .select("id, nombre, apellidos")
        .eq("id", usuarioId)
        .maybeSingle(),

      supabase
        .from("temporada")
        .select("id, nombre, fecha_inicio, fecha_fin, activa")
        .eq("activa", true)
        .maybeSingle(),

      supabase
        .from("equipo")
        .select("id, nombre, categoria, orden_categoria")
        .order("orden_categoria", {
          ascending: true,
          nullsFirst: false,
        })
        .order("nombre", { ascending: true }),

      supabase
        .from("equipo_fase")
        .select(
          "id, idequipo, idtemporada, fase, liga, grupo, subgrupo, fecha_inicio, fecha_fin, viva"
        )
        .order("fase", { ascending: true }),

      supabase
        .from("usuario_equipo_fase")
        .select("usuario_id, equipo_fase_id, rol")
        .eq("usuario_id", usuarioId),

      supabase
        .from("usuario_rol")
        .select("usuario_id, rol")
        .eq("usuario_id", usuarioId),

      supabase
        .from("jugadores")
        .select("id, nombre, apellidos")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),

      supabase
        .from("padre_jugador")
        .select("usuario_id, jugador_id")
        .eq("usuario_id", usuarioId),
    ]);

    if (usuarioError) {
      setError(usuarioError.message);
      setCargando(false);
      return;
    }

    if (temporadaError) {
      setError(temporadaError.message);
      setCargando(false);
      return;
    }

    if (equiposError) {
      setError(equiposError.message);
      setCargando(false);
      return;
    }

    if (fasesError) {
      setError(fasesError.message);
      setCargando(false);
      return;
    }

    if (usuarioEquiposError) {
      setError(usuarioEquiposError.message);
      setCargando(false);
      return;
    }

    if (rolesError) {
      setError(rolesError.message);
      setCargando(false);
      return;
    }

    if (jugadoresError) {
      setError(jugadoresError.message);
      setCargando(false);
      return;
    }

    if (padresError) {
      setError(padresError.message);
      setCargando(false);
      return;
    }

    if (!usuarioData) {
      setError("No se ha encontrado el usuario.");
      setCargando(false);
      return;
    }

    const usuarioActual = usuarioData as Usuario;
    const temporadaActual = (temporadaData ?? null) as Temporada | null;
    const equipos = (equiposData ?? []) as Equipo[];
    const fases = (fasesData ?? []) as EquipoFase[];
    const usuarioEquipos =
      (usuarioEquiposData ?? []) as UsuarioEquipoFase[];
    const rolesActuales = (rolesData ?? []) as Rol[];
    const jugadoresActuales = (jugadoresData ?? []) as Jugador[];
    const padresActuales = (padresData ?? []) as PadreJugador[];

    const equiposMap = new Map<number, Equipo>(
      equipos.map((equipo) => [equipo.id, equipo])
    );

    const fasesConEquipo: EquipoFaseConEquipo[] = fases
      .filter((fase) => equiposMap.has(fase.idequipo))
      .map((fase) => ({
        ...fase,
        equipo: equiposMap.get(fase.idequipo)!,
      }));

    const idsEquiposTemporada = temporadaActual
      ? fasesConEquipo
          .filter(
            (fase) => fase.idtemporada === temporadaActual.id
          )
          .map((fase) => fase.id)
      : [];

    const asignacionesActuales: AsignacionEquipoFase[] =
      usuarioEquipos
        .filter((item) =>
          idsEquiposTemporada.includes(item.equipo_fase_id)
        )
        .map((item) => ({
          equipo_fase_id: item.equipo_fase_id,
          rol: item.rol,
        }));

    const rolesTexto = rolesActuales
      .map((item) => item.rol)
      .filter(Boolean);

    const jugadoresTutor = padresActuales.map(
      (item) => item.jugador_id
    );

    setUsuario(usuarioActual);
    setTemporada(temporadaActual);
    setEquiposFases(fasesConEquipo);
    setJugadores(jugadoresActuales);

    setNombre(usuarioActual.nombre ?? "");
    setApellidos(usuarioActual.apellidos ?? "");

    setRoles(rolesTexto);
    setRolesIniciales(rolesTexto);

    setAsignacionesEquipoFase(asignacionesActuales);
    setAsignacionesIniciales(asignacionesActuales);

    setSeleccionadosJugadores(jugadoresTutor);
    setJugadoresIniciales(jugadoresTutor);

    setCargando(false);
  }

  const fasesTemporadaActiva = useMemo(() => {
    if (!temporada) {
      return [];
    }

    return equiposFases.filter(
      (item) => item.idtemporada === temporada.id
    );
  }, [equiposFases, temporada]);

  const equiposFasesFiltrados = useMemo(() => {
    const texto = busquedaEquipo.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return fasesTemporadaActiva.filter((item) => {
      const nombreEquipo = item.equipo.nombre.toLowerCase();

      const fase =
        item.fase !== null && item.fase !== undefined
          ? `fase ${item.fase}`
          : "";

      const liga = item.liga?.toLowerCase() ?? "";
      const grupo = item.grupo?.toLowerCase() ?? "";
      const subgrupo = item.subgrupo?.toLowerCase() ?? "";

      return (
        nombreEquipo.includes(texto) ||
        fase.includes(texto) ||
        liga.includes(texto) ||
        grupo.includes(texto) ||
        subgrupo.includes(texto) ||
        String(item.fase ?? "").includes(texto)
      );
    });
  }, [fasesTemporadaActiva, busquedaEquipo]);

  const jugadoresFiltrados = useMemo(() => {
    const texto = busquedaJugador.trim().toLowerCase();

    if (!texto) {
      return [];
    }

    return jugadores.filter((jugador) => {
      const nombreCompleto =
        `${jugador.nombre} ${jugador.apellidos}`.toLowerCase();

      return nombreCompleto.includes(texto);
    });
  }, [jugadores, busquedaJugador]);

  const fasesSeleccionadas = useMemo(() => {
    return asignacionesEquipoFase
      .map((asignacion) => {
        const fase = fasesTemporadaActiva.find(
          (item) => item.id === asignacion.equipo_fase_id
        );

        if (!fase) {
          return null;
        }

        return {
          fase,
          rol: asignacion.rol,
        };
      })
      .filter(
        (
          item
        ): item is {
          fase: EquipoFaseConEquipo;
          rol: string | null;
        } => item !== null
      );
  }, [asignacionesEquipoFase, fasesTemporadaActiva]);

  const jugadoresSeleccionados = useMemo(() => {
    return seleccionadosJugadores
      .map((id) =>
        jugadores.find((jugador) => jugador.id === id)
      )
      .filter(
        (item): item is Jugador => item !== undefined
      );
  }, [seleccionadosJugadores, jugadores]);

  function nombreEquipoFase(item: EquipoFaseConEquipo) {
    const nombreEquipo = item.equipo.nombre;

    if (item.fase !== null && item.fase !== undefined) {
      return `${nombreEquipo} · Fase ${item.fase}`;
    }

    return nombreEquipo;
  }

  function nombreJugador(jugador: Jugador) {
    return `${jugador.nombre} ${jugador.apellidos}`.trim();
  }

  function nombreRolEquipo(rol: string | null) {
    if (rol === "entrenador") {
      return "Entrenador";
    }

    if (rol === "delegado") {
      return "Delegado";
    }

    return "Sin rol";
  }

  function añadirRol() {
    if (!nuevoRol) {
      return;
    }

    const existe = roles.some(
      (item) =>
        item.toLowerCase() === nuevoRol.toLowerCase()
    );

    if (existe) {
      setNuevoRol("");
      return;
    }

    setRoles((actuales) => [...actuales, nuevoRol]);
    setNuevoRol("");
  }

  function eliminarRol(rol: string) {
    setRoles((actuales) =>
      actuales.filter((item) => item !== rol)
    );
  }

  function añadirEquipoFase(id: number) {
    if (!seleccionRolEquipo) {
      return;
    }

    setAsignacionesEquipoFase((actuales) => {
      const existe = actuales.some(
        (item) => item.equipo_fase_id === id
      );

      if (existe) {
        return actuales;
      }

      return [
        ...actuales,
        {
          equipo_fase_id: id,
          rol: seleccionRolEquipo,
        },
      ];
    });

    setBusquedaEquipo("");
    setSeleccionRolEquipo("");
  }

  function cambiarRolEquipoFase(
    equipoFaseId: number,
    rol: string
  ) {
    setAsignacionesEquipoFase((actuales) =>
      actuales.map((item) =>
        item.equipo_fase_id === equipoFaseId
          ? {
              ...item,
              rol: rol || null,
            }
          : item
      )
    );
  }

  function eliminarEquipoFase(id: number) {
    setAsignacionesEquipoFase((actuales) =>
      actuales.filter(
        (item) => item.equipo_fase_id !== id
      )
    );
  }

  function añadirJugador(id: number) {
    setSeleccionadosJugadores((actuales) =>
      actuales.includes(id) ? actuales : [...actuales, id]
    );

    setBusquedaJugador("");
  }

  function eliminarJugador(id: number) {
    setSeleccionadosJugadores((actuales) =>
      actuales.filter((item) => item !== id)
    );
  }

  async function guardarCambios() {
    if (!usuario) {
      return;
    }

    const nombreLimpio = nombre.trim();
    const apellidosLimpios = apellidos.trim();

    if (!nombreLimpio || !apellidosLimpios) {
      setError("El nombre y los apellidos son obligatorios.");
      return;
    }

    const asignacionesSinRol = asignacionesEquipoFase.filter(
      (item) =>
        item.rol !== "entrenador" &&
        item.rol !== "delegado"
    );

    if (asignacionesSinRol.length > 0) {
      setError(
        "Todas las asignaciones de equipo deben tener un rol: Entrenador o Delegado."
      );
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      /*
       * DATOS BÁSICOS
       */

      const { error: usuarioError } = await supabase
        .from("perfil_usuario")
        .update({
          nombre: nombreLimpio,
          apellidos: apellidosLimpios,
        })
        .eq("id", usuario.id);

      if (usuarioError) {
        throw usuarioError;
      }

      /*
       * ROLES
       *
       * Solo modificamos los roles de este usuario.
       */

      const rolesNormalizados = roles
        .map((rol) => rol.trim())
        .filter(Boolean);

      const rolesInicialesNormalizados = rolesIniciales
        .map((rol) => rol.trim())
        .filter(Boolean);

      const rolesAEliminar =
        rolesInicialesNormalizados.filter(
          (rol) => !rolesNormalizados.includes(rol)
        );

      const rolesANuevos = rolesNormalizados.filter(
        (rol) => !rolesInicialesNormalizados.includes(rol)
      );

      if (rolesAEliminar.length > 0) {
        const { error } = await supabase
          .from("usuario_rol")
          .delete()
          .eq("usuario_id", usuario.id)
          .in("rol", rolesAEliminar);

        if (error) {
          throw error;
        }
      }

      if (rolesANuevos.length > 0) {
        const { error } = await supabase
          .from("usuario_rol")
          .insert(
            rolesANuevos.map((rol) => ({
              usuario_id: usuario.id,
              rol,
            }))
          );

        if (error) {
          throw error;
        }
      }

      /*
       * EQUIPOS / FASES
       *
       * Solo gestionamos las relaciones de la temporada activa.
       * Las relaciones de temporadas anteriores se conservan.
       *
       * Para la temporada activa eliminamos las relaciones
       * actuales y volvemos a insertar las que corresponden,
       * incluyendo su rol de Entrenador o Delegado.
       */

      if (temporada) {
        const idsFasesTemporadaActiva =
          fasesTemporadaActiva.map((item) => item.id);

        if (idsFasesTemporadaActiva.length > 0) {
          const { error: eliminarError } = await supabase
            .from("usuario_equipo_fase")
            .delete()
            .eq("usuario_id", usuario.id)
            .in(
              "equipo_fase_id",
              idsFasesTemporadaActiva
            );

          if (eliminarError) {
            throw eliminarError;
          }
        }

        if (asignacionesEquipoFase.length > 0) {
          const { error: insertarError } = await supabase
            .from("usuario_equipo_fase")
            .insert(
              asignacionesEquipoFase.map((asignacion) => ({
                usuario_id: usuario.id,
                equipo_fase_id:
                  asignacion.equipo_fase_id,
                rol: asignacion.rol,
              }))
            );

          if (insertarError) {
            throw insertarError;
          }
        }
      }

      /*
       * JUGADORES / TUTORES
       *
       * padre_jugador es una relación global,
       * no dependiente de temporada.
       */

      const jugadoresActuales = jugadoresIniciales;

      const jugadoresAEliminar =
        jugadoresActuales.filter(
          (id) => !seleccionadosJugadores.includes(id)
        );

      const jugadoresANuevos =
        seleccionadosJugadores.filter(
          (id) => !jugadoresActuales.includes(id)
        );

      if (jugadoresAEliminar.length > 0) {
        const { error } = await supabase
          .from("padre_jugador")
          .delete()
          .eq("usuario_id", usuario.id)
          .in("jugador_id", jugadoresAEliminar);

        if (error) {
          throw error;
        }
      }

      if (jugadoresANuevos.length > 0) {
        const { error } = await supabase
          .from("padre_jugador")
          .insert(
            jugadoresANuevos.map((jugadorId) => ({
              usuario_id: usuario.id,
              jugador_id: jugadorId,
            }))
          );

        if (error) {
          throw error;
        }
      }

      router.push("/admin/usuarios");
      router.refresh();
    } catch (err) {
      const mensajeError =
        err instanceof Error
          ? err.message
          : "No se han podido guardar los cambios.";

      setError(mensajeError);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/usuarios"
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
            ← Volver a usuarios
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando usuario...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/usuarios"
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
            ← Volver a usuarios
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-700">
              Usuario no encontrado.
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
          href="/admin/usuarios"
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
          ← Volver a usuarios
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar usuario
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestiona sus datos, roles, equipos y jugadores vinculados.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {mensaje}
          </div>
        )}

        <div className="space-y-4">
          {/* DATOS BÁSICOS */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Datos básicos
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Nombre
                </label>

                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
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
                <label
                  htmlFor="apellidos"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Apellidos
                </label>

                <input
                  id="apellidos"
                  type="text"
                  value={apellidos}
                  onChange={(e) =>
                    setApellidos(e.target.value)
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
            </div>
          </section>

          {/* ROLES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Roles
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Selecciona los roles que tendrá el usuario.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {roles.length}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <select
                value={nuevoRol}
                onChange={(e) =>
                  setNuevoRol(e.target.value)
                }
                className="
                  min-w-0
                  flex-1
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-gray-700
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <option value="">
                  Seleccionar rol...
                </option>

                {ROLES_DISPONIBLES.map((rol) => (
                  <option
                    key={rol.valor}
                    value={rol.valor}
                  >
                    {rol.nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={añadirRol}
                disabled={!nuevoRol}
                className="
                  shrink-0
                  rounded-xl
                  bg-blue-600
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Añadir
              </button>
            </div>

            {roles.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {roles.map((rol) => {
                  const rolConfigurado =
                    ROLES_DISPONIBLES.find(
                      (item) =>
                        item.valor === rol.toLowerCase()
                    );

                  return (
                    <div
                      key={rol}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1.5
                        text-sm
                        font-semibold
                        text-blue-700
                      "
                    >
                      <span>
                        {rolConfigurado?.nombre ?? rol}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarRol(rol)
                        }
                        className="
                          text-blue-400
                          transition
                          hover:text-blue-700
                        "
                        aria-label={`Eliminar rol ${rol}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                No hay roles asignados.
              </p>
            )}
          </section>

          {/* EQUIPOS / FASES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Equipos / fases
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {temporada
                    ? `Temporada ${temporada.nombre}`
                    : "No hay temporada activa"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {asignacionesEquipoFase.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="busqueda-equipo"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Equipo / fase
                </label>

                <input
                  id="busqueda-equipo"
                  type="text"
                  value={busquedaEquipo}
                  onChange={(e) =>
                    setBusquedaEquipo(e.target.value)
                  }
                  placeholder="Buscar equipo o fase..."
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
                <label
                  htmlFor="rol-equipo"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Rol en este equipo
                </label>

                <div className="flex gap-2">
                  <select
                    id="rol-equipo"
                    value={seleccionRolEquipo}
                    onChange={(e) =>
                      setSeleccionRolEquipo(
                        e.target.value
                      )
                    }
                    className="
                      min-w-0
                      flex-1
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                      text-gray-700
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  >
                    <option value="">
                      Seleccionar rol...
                    </option>

                    {ROLES_EQUIPO.map((rol) => (
                      <option
                        key={rol.valor}
                        value={rol.valor}
                      >
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {busquedaEquipo.trim() && (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {equiposFasesFiltrados.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No se han encontrado equipos o fases.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {equiposFasesFiltrados.map((item) => {
                        const seleccionado =
                          asignacionesEquipoFase.some(
                            (asignacion) =>
                              asignacion.equipo_fase_id ===
                              item.id
                          );

                        const puedeAñadir =
                          !seleccionado &&
                          !!seleccionRolEquipo;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={!puedeAñadir}
                            onClick={() =>
                              añadirEquipoFase(
                                item.id
                              )
                            }
                            className={`
                              block
                              w-full
                              border-b
                              border-gray-100
                              px-4
                              py-3
                              text-left
                              last:border-b-0
                              ${
                                seleccionado
                                  ? "cursor-default bg-gray-50 text-gray-400"
                                  : !seleccionRolEquipo
                                  ? "cursor-not-allowed text-gray-400"
                                  : "text-gray-700 transition hover:bg-blue-50"
                              }
                            `}
                          >
                            <span className="block text-sm font-semibold">
                              {nombreEquipoFase(item)}
                            </span>

                            <span className="mt-0.5 block text-xs text-gray-400">
                              {[
                                item.liga,
                                item.grupo
                                  ? `Grupo ${item.grupo}`
                                  : null,
                                item.subgrupo
                                  ? `Subgrupo ${item.subgrupo}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") ||
                                "Sin datos adicionales"}
                            </span>

                            {seleccionado && (
                              <span className="mt-1 block text-xs font-semibold text-gray-400">
                                Ya asignado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!seleccionRolEquipo &&
                busquedaEquipo.trim() && (
                  <p className="text-xs text-gray-400">
                    Selecciona primero el rol para poder
                    añadir el equipo.
                  </p>
                )}
            </div>

            {fasesSeleccionadas.length > 0 ? (
              <div className="mt-5 space-y-2">
                {fasesSeleccionadas.map(
                  ({ fase, rol }) => (
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
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {nombreEquipoFase(fase)}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
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
                              "Sin datos adicionales"}
                          </p>
                        </div>

                        <select
                          value={rol ?? ""}
                          onChange={(e) =>
                            cambiarRolEquipoFase(
                              fase.id,
                              e.target.value
                            )
                          }
                          className="
                            shrink-0
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-gray-700
                            outline-none
                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100
                          "
                          aria-label={`Rol de ${nombreEquipoFase(
                            fase
                          )}`}
                        >
                          <option value="">
                            Sin rol
                          </option>

                          {ROLES_EQUIPO.map((rolEquipo) => (
                            <option
                              key={rolEquipo.valor}
                              value={rolEquipo.valor}
                            >
                              {rolEquipo.nombre}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            eliminarEquipoFase(
                              fase.id
                            )
                          }
                          className="
                            shrink-0
                            text-gray-400
                            transition
                            hover:text-red-600
                          "
                          aria-label={`Eliminar ${nombreEquipoFase(
                            fase
                          )}`}
                        >
                          ×
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        Rol actual:{" "}
                        <span className="font-semibold text-gray-600">
                          {nombreRolEquipo(rol)}
                        </span>
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                No hay equipos o fases seleccionados.
              </p>
            )}
          </section>

          {/* JUGADORES / TUTORES */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Jugadores como tutor
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Jugadores vinculados a este usuario.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {seleccionadosJugadores.length}
              </span>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={busquedaJugador}
                onChange={(e) =>
                  setBusquedaJugador(e.target.value)
                }
                placeholder="Buscar jugador..."
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

              {busquedaJugador.trim() && (
                <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {jugadoresFiltrados.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No se han encontrado jugadores.
                    </p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {jugadoresFiltrados.map((jugador) => {
                        const seleccionado =
                          seleccionadosJugadores.includes(
                            jugador.id
                          );

                        return (
                          <button
                            key={jugador.id}
                            type="button"
                            disabled={seleccionado}
                            onClick={() =>
                              añadirJugador(
                                jugador.id
                              )
                            }
                            className={`
                              block
                              w-full
                              border-b
                              border-gray-100
                              px-4
                              py-3
                              text-left
                              last:border-b-0
                              ${
                                seleccionado
                                  ? "cursor-default bg-gray-50 text-gray-400"
                                  : "text-gray-700 transition hover:bg-blue-50"
                              }
                            `}
                          >
                            <span className="block text-sm font-semibold">
                              {nombreJugador(jugador)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {jugadoresSeleccionados.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {jugadoresSeleccionados.map((jugador) => (
                  <div
                    key={jugador.id}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-full
                      bg-gray-100
                      px-3
                      py-1.5
                      text-sm
                      font-semibold
                      text-gray-700
                    "
                  >
                    <span>
                      {nombreJugador(jugador)}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarJugador(jugador.id)
                      }
                      className="
                        text-gray-400
                        transition
                        hover:text-gray-700
                      "
                      aria-label={`Eliminar ${nombreJugador(
                        jugador
                      )}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                No hay jugadores vinculados como tutor.
              </p>
            )}
          </section>

          {/* GUARDAR */}
          <button
            type="button"
            onClick={guardarCambios}
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
              disabled:opacity-60
            "
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </main>
  );
}
