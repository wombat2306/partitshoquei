"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CompletarCuentaPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] =
    useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    setCargando(true);
    setError(null);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setError(
        "El enlace de invitación no es válido o ha caducado."
      );
      setCargando(false);
      return;
    }

    setEmail(user.email ?? "");

    const perfilResult = await supabase
      .from("perfil_usuario")
      .select("nombre,apellidos")
      .eq("id", user.id)
      .maybeSingle();

    if (perfilResult.error) {
      console.error(perfilResult.error);
    }

    if (perfilResult.data) {
      setNombre(perfilResult.data.nombre ?? "");
      setApellidos(perfilResult.data.apellidos ?? "");
    }

    setCargando(false);
  }

  async function guardarDatos(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError(null);

    const nombreLimpio = nombre.trim();
    const apellidosLimpios = apellidos.trim();

    if (!nombreLimpio) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!apellidosLimpios) {
      setError("Los apellidos son obligatorios.");
      return;
    }

    if (password.length < 6) {
      setError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== passwordConfirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    try {
      const {
        data: { user },
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError || !user) {
        throw new Error(
          "No se ha podido identificar al usuario."
        );
      }

      // Actualizar contraseña
      const { error: passwordError } =
        await supabase.auth.updateUser({
          password,
        });

      if (passwordError) {
        throw passwordError;
      }

      // Crear o actualizar perfil
      const { error: perfilError } = await supabase
        .from("perfil_usuario")
        .upsert(
          {
            id: user.id,
            nombre: nombreLimpio,
            apellidos: apellidosLimpios,
          },
          {
            onConflict: "id",
          }
        );

      if (perfilError) {
        throw perfilError;
      }

      router.push("/socios");
      router.refresh();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "No se han podido guardar los datos."
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            Cargando...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">
            Completa tu cuenta
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Introduce tus datos y establece una contraseña
            para acceder a la aplicación.
          </p>
        </div>

        <form
          onSubmit={guardarDatos}
          className="rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                Email
              </label>

              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none"
              />
            </div>

            {/* NOMBRE */}
            <div>
              <label
                htmlFor="nombre"
                className="mb-1 block text-[11px] font-medium text-gray-600"
              >
                Nombre *
              </label>

              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                autoComplete="given-name"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {/* APELLIDOS */}
            <div>
              <label
                htmlFor="apellidos"
                className="mb-1 block text-[11px] font-medium text-gray-600"
              >
                Apellidos *
              </label>

              <input
                id="apellidos"
                type="text"
                value={apellidos}
                onChange={(e) =>
                  setApellidos(e.target.value)
                }
                autoComplete="family-name"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-medium text-gray-600"
              >
                Contraseña *
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {/* REPETIR CONTRASEÑA */}
            <div>
              <label
                htmlFor="passwordConfirmacion"
                className="mb-1 block text-[11px] font-medium text-gray-600"
              >
                Repetir contraseña *
              </label>

              <input
                id="passwordConfirmacion"
                type="password"
                value={passwordConfirmacion}
                onChange={(e) =>
                  setPasswordConfirmacion(e.target.value)
                }
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : "Completar cuenta"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
