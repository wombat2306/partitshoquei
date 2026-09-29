"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CambiarContrasenaPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [repetirPassword, setRepetirPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (password.length < 6) {
      setError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== repetirPassword) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(error);

      setError(
        "No se ha podido cambiar la contraseña. El enlace puede haber caducado."
      );

      setLoading(false);
      return;
    }

    setMensaje(
      "Contraseña cambiada correctamente."
    );

    setLoading(false);

    setTimeout(() => {
      router.replace("/socios");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">

          <div className="mb-4 flex justify-center">
            <img
              src="/sagrerenc.jpg"
              alt="Hockey"
              className="h-16 w-16 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            SAGRERENC
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Cambia tu contraseña
          </p>

        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Nueva contraseña
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Introduce tu nueva contraseña para
            recuperar el acceso a tu cuenta.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Nueva contraseña
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="••••••••"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  text-gray-900
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
                htmlFor="repetirPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Repetir contraseña
              </label>

              <input
                id="repetirPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={repetirPassword}
                onChange={(event) =>
                  setRepetirPassword(
                    event.target.value
                  )
                }
                placeholder="••••••••"
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-3
                  text-gray-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />

            </div>

            {error && (
              <div
                className="
                  rounded-xl
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-700
                "
              >
                {error}
              </div>
            )}

            {mensaje && (
              <div
                className="
                  rounded-xl
                  bg-green-50
                  px-4
                  py-3
                  text-sm
                  text-green-700
                "
              >
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-xl
                bg-blue-600
                px-4
                py-3
                font-semibold
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "Guardando..."
                : "Cambiar contraseña"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}
