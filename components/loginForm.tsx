"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo electrónico o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    /*
     * Si el usuario intentó entrar directamente en una página
     * privada, volvemos a esa página.
     */
    const next = searchParams.get("next");

    router.replace(next || "/socios");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">

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
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@ejemplo.com"
          className="
            w-full rounded-xl
            border border-gray-300
            bg-white
            px-4 py-3
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
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Contraseña
        </label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className="
            w-full rounded-xl
            border border-gray-300
            bg-white
            px-4 py-3
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
            px-4 py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          rounded-xl
          bg-blue-600
          px-4 py-3
          font-semibold
          text-white
          transition
          hover:bg-blue-700
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading ? "Entrando..." : "Iniciar sesión"}
      </button>


      <div className="text-center">
        <button
          type="button"
          onClick={() =>
            router.push("/recuperar-contrasena")
          }
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          He olvidado la contraseña
        </button>
      </div>

    </form>
  );
}