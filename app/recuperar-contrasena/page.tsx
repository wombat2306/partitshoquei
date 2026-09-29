"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMensaje("");
    setError("");

    const supabase = createClient();

    const { error } =
       await supabase.auth.resetPasswordForEmail(
        email,
        {
        redirectTo:
            `${window.location.origin}/cambiar-contrasena`,
        }
    );

    if (error) {
      console.error(error);
      setError(
        "No se ha podido enviar el correo de recuperación."
      );
      setLoading(false);
      return;
    }

    setMensaje(
      "Si el correo está registrado, recibirás un enlace para cambiar la contraseña."
    );

    setLoading(false);
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
            Recupera el acceso a tu cuenta
          </p>

        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            He olvidado la contraseña
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Introduce tu correo electrónico y te
            enviaremos un enlace para establecer una
            nueva contraseña.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="correo@ejemplo.com"
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
                ? "Enviando..."
                : "Enviar enlace"}
            </button>

          </form>

          <div className="mt-5 text-center">

            <button
              type="button"
              onClick={() =>
                window.location.href = "/socios"
              }
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
            >
              ← Volver al inicio de sesión
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}