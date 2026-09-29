"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PerfilUsuario = {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  created_at: string;
};

type JugadorRelacionado = {
  id: number;
  nombre: string;
  apellidos: string;
  activo: boolean;
};

export default function PerfilSocioPage() {
  const supabase = createClient();

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const [jugadoresRelacionados, setJugadoresRelacionados] = useState<JugadorRelacionado[]>([]);

  const [cargandoRelaciones, setCargandoRelaciones] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    setCargando(true);
    setError(null);

    try {
      const {
        data: { user },
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      if (!user) {
        throw new Error(
          "No se ha podido identificar al usuario."
        );
      }

      const { data, error: perfilError } = await supabase
        .from("perfil_usuario")
        .select("id,nombre,apellidos,telefono,created_at")
        .eq("id", user.id)
        .single();

      if (perfilError) {
        throw perfilError;
      }

      const perfilData = data as PerfilUsuario;

      setPerfil(perfilData);

      setNombre(perfilData.nombre ?? "");
      setApellidos(perfilData.apellidos ?? "");
      setTelefono(perfilData.telefono ?? "");

      const { data: relaciones, error: relacionesError } =
  await supabase
    .from("padre_jugador")
    .select("jugador_id")
    .eq("usuario_id", user.id);

if (relacionesError) {
  throw relacionesError;
}

const idsJugadores = (relaciones ?? []).map(
  (relacion) => relacion.jugador_id
);

if (idsJugadores.length === 0) {
  setJugadoresRelacionados([]);
} else {
  const { data: jugadoresData, error: jugadoresError } =
    await supabase
      .from("jugadores")
      .select("id,nombre,apellidos,activo")
      .in("id", idsJugadores)
      .order("apellidos", { ascending: true })
      .order("nombre", { ascending: true });

  if (jugadoresError) {
    throw jugadoresError;
  }

  setJugadoresRelacionados(
    (jugadoresData ?? []) as JugadorRelacionado[]
  );
}

    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se han podido cargar tus datos."
        );
      }
    } finally {
      setCargando(false);
      setCargandoRelaciones(false);
    }
  }

  async function guardarCambios(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setError(null);
    setMensaje("");

    try {
      const {
        data: { user },
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      if (!user) {
        throw new Error(
          "No se ha podido identificar al usuario."
        );
      }

      const { data, error: actualizarError } =
        await supabase
          .from("perfil_usuario")
          .update({
            nombre: nombre.trim(),
            apellidos: apellidos.trim(),
            telefono: telefono.trim(),
          })
          .eq("id", user.id)
          .select(
            "id,nombre,apellidos,telefono,created_at"
          )
          .single();

      if (actualizarError) {
        throw actualizarError;
      }

      setPerfil(data as PerfilUsuario);

      setNombre(data.nombre ?? "");
      setApellidos(data.apellidos ?? "");
      setTelefono(data.telefono ?? "");

      setMensaje(
        "Tus datos se han guardado correctamente."
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se han podido guardar los cambios."
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            Cargando perfil...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-3xl space-y-4">

        {/* CABECERA */}
        <div>
          <Link
            href="/socios"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Zona socios
          </Link>

          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            Mi perfil
          </h1>

          <p className="mt-0.5 text-xs text-gray-500">
            Consulta y modifica tus datos personales.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* MENSAJE */}
        {mensaje && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {mensaje}
          </div>
        )}

        {perfil && (
          <>
            {/* DATOS PERSONALES */}
            <section className="rounded-2xl bg-white p-5 shadow-sm">

              <h2 className="text-sm font-semibold text-gray-900">
                Datos personales
              </h2>

              <form
                onSubmit={guardarCambios}
                className="mt-5 space-y-4"
              >

                {/* NOMBRE */}
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombre"
                    type="text"
                    required
                    value={nombre}
                    onChange={(event) =>
                      setNombre(event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* APELLIDOS */}
                <div>
                  <label
                    htmlFor="apellidos"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Apellidos
                  </label>

                  <input
                    id="apellidos"
                    type="text"
                    required
                    value={apellidos}
                    onChange={(event) =>
                      setApellidos(event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* TELEFONO */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Teléfono
                  </label>

                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(event) =>
                      setTelefono(event.target.value)
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* ID */}
                {/*
                <div>
                  <label
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    ID de usuario
                  </label>

                  <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                    {perfil.id}
                  </div>
                </div>
                */}
                {/* FECHA */}
                {/*
                <div>
                  <label
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                  >
                    Usuario desde
                  </label>

                  <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                    {new Date(
                      perfil.created_at
                    ).toLocaleDateString("es-ES")}
                  </div>
                </div>
                */}

                <button
                  type="submit"
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

              </form>
            </section>

            {/* RELACIONES */}
            {/* RELACIONES */}
<section className="rounded-2xl bg-white p-5 shadow-sm">

  <h2 className="text-sm font-semibold text-gray-900">
    Mis relaciones
  </h2>

  <p className="mt-1 text-xs text-gray-500">
    Jugadores vinculados a tu cuenta.
  </p>

  {cargandoRelaciones ? (
    <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-500">
      Cargando relaciones...
    </div>
  ) : jugadoresRelacionados.length === 0 ? (
    <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-500">
      No tienes jugadores vinculados a tu cuenta.
    </div>
  ) : (
    <div className="mt-4 space-y-2">

      {jugadoresRelacionados.map((jugador) => (
        <div
          key={jugador.id}
          className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">

              <div className="text-sm font-medium text-gray-900">
                {jugador.nombre} {jugador.apellidos}
              </div>

              <div className="mt-0.5 text-[11px] text-gray-500">
                Jugador
              </div>

            </div>

            <div
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                jugador.activo
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {jugador.activo
                ? "Activo"
                : "Inactivo"}
            </div>

          </div>
        </div>
      ))}

    </div>
  )}

</section>
          </>
        )}

      </div>
    </main>
  );
}
