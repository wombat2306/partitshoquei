"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NuevoEquipoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [grupo, setGrupo] = useState("");
  const [subgrup, setSubgrup] = useState("");
  const [liga, setLiga] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [ordenCategoria, setOrdenCategoria] = useState("");
  const [fecapa, setFecapa] = useState(false);
  const [idClub, setIdClub] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardarEquipo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      setError("El nombre del equipo es obligatorio.");
      return;
    }

    let clubId: number | null = null;

    if (idClub.trim()) {
      clubId = Number(idClub);

      if (!Number.isInteger(clubId) || clubId < 0) {
        setError("El ID del club no es válido.");
        return;
      }
    }

    let orden: number | null = null;

    if (ordenCategoria.trim()) {
      orden = Number(ordenCategoria);

      if (!Number.isInteger(orden)) {
        setError("El orden de categoría no es válido.");
        return;
      }
    }

    setGuardando(true);

    try {
      const { data, error } = await supabase
        .from("equipo")
        .insert({
          nombre: nombreLimpio,
          categoria: categoria.trim() || null,
          grupo: grupo.trim() || null,
          subgrup: subgrup.trim() || null,
          liga: liga.trim() || null,
          etiqueta: etiqueta.trim() || null,
          orden_categoria: orden,
          fecapa,
          idClub: clubId,
        })
        .select("id")
        .single();

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      if (!data?.id) {
        setError("El equipo se ha creado, pero no se ha podido obtener su ID.");
        return;
      }

      router.push(`/admin/equipos/${data.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se ha podido crear el equipo.");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        {/* CABECERA */}
        <div className="mb-5">
          <Link
            href="/admin/equipos"
            className="text-xs text-gray-500 transition hover:text-gray-700"
          >
            ← Equipos / fases
          </Link>

          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            Añadir equipo
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Crea un nuevo equipo. Las fases y temporadas se añadirán después.
          </p>
        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={guardarEquipo}
          className="rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="space-y-4">
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
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juvenil A"
                required
                autoFocus
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />
            </div>

            {/* CATEGORIA + ORDEN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="categoria"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Categoría
                </label>

                <input
                  id="categoria"
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej. Juvenil"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ordenCategoria"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Orden categoría
                </label>

                <input
                  id="ordenCategoria"
                  type="number"
                  step="1"
                  value={ordenCategoria}
                  onChange={(e) => setOrdenCategoria(e.target.value)}
                  placeholder="Ej. 1"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            {/* GRUPO + SUBGRUPO */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="grupo"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Grupo
                </label>

                <input
                  id="grupo"
                  type="text"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  placeholder="Ej. A"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="subgrup"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Subgrupo
                </label>

                <input
                  id="subgrup"
                  type="text"
                  value={subgrup}
                  onChange={(e) => setSubgrup(e.target.value)}
                  placeholder="Ej. 1"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            {/* LIGA + ETIQUETA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="liga"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Liga
                </label>

                <input
                  id="liga"
                  type="text"
                  value={liga}
                  onChange={(e) => setLiga(e.target.value)}
                  placeholder="Ej. OK Plata"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="etiqueta"
                  className="mb-1 block text-[11px] font-medium text-gray-600"
                >
                  Etiqueta
                </label>

                <input
                  id="etiqueta"
                  type="text"
                  value={etiqueta}
                  onChange={(e) => setEtiqueta(e.target.value)}
                  placeholder="Ej. Primer equipo"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            {/* CLUB */}
            <div>
              <label
                htmlFor="idClub"
                className="mb-1 block text-[11px] font-medium text-gray-600"
              >
                ID Club
              </label>

              <input
                id="idClub"
                type="number"
                min="0"
                step="1"
                value={idClub}
                onChange={(e) => setIdClub(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
              />

              <p className="mt-1 text-[10px] text-gray-400">
                Déjalo vacío si el equipo no tiene club asociado.
              </p>
            </div>

            {/* FECAPA */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-gray-800">
                  FECAPA
                </div>

                <div className="text-[11px] text-gray-500">
                  Indica si el equipo pertenece a FECAPA.
                </div>
              </div>

              <input
                type="checkbox"
                checked={fecapa}
                onChange={(e) => setFecapa(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            {/* ERROR */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-2 pt-1">
              <Link
                href="/admin/equipos"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Crear equipo"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
