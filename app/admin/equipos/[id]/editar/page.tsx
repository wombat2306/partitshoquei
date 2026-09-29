"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Equipo = {
  id: number;
  nombre: string;
  grupo: string | null;
  liga: string | null;
  etiqueta: string | null;
  fecapa: boolean | null;
  idClub: number | null;
  categoria: string | null;
  subgrup: string | null;
  orden_categoria: number | null;
};

export default function EditarEquipoPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const equipoId = Number(params.id);

  const [equipo, setEquipo] = useState<Equipo | null>(null);

  const [nombre, setNombre] = useState("");
  const [grupo, setGrupo] = useState("");
  const [liga, setLiga] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [fecapa, setFecapa] = useState(false);
  const [idClub, setIdClub] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subgrup, setSubgrup] = useState("");
  const [ordenCategoria, setOrdenCategoria] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(equipoId)) {
      setError("El equipo indicado no es válido.");
      setCargando(false);
      return;
    }

    cargarEquipo();
  }, [equipoId]);

  async function cargarEquipo() {
    setCargando(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("equipo")
        .select(
          `
            id,
            nombre,
            grupo,
            liga,
            etiqueta,
            fecapa,
            idClub,
            categoria,
            subgrup,
            orden_categoria
          `
        )
        .eq("id", equipoId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setError("No se ha encontrado el equipo.");
        return;
      }

      setEquipo(data);

      setNombre(data.nombre ?? "");
      setGrupo(data.grupo ?? "");
      setLiga(data.liga ?? "");
      setEtiqueta(data.etiqueta ?? "");
      setFecapa(data.fecapa ?? false);
      setIdClub(
        data.idClub !== null && data.idClub !== undefined
          ? String(data.idClub)
          : ""
      );
      setCategoria(data.categoria ?? "");
      setSubgrup(data.subgrup ?? "");
      setOrdenCategoria(
        data.orden_categoria !== null &&
        data.orden_categoria !== undefined
          ? String(data.orden_categoria)
          : ""
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se ha podido cargar la información del equipo."
      );
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      setError("El nombre del equipo es obligatorio.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const idClubNumero =
        idClub.trim() === ""
          ? null
          : Number(idClub);

      if (
        idClubNumero !== null &&
        !Number.isInteger(idClubNumero)
      ) {
        setError("El ID Club debe ser un número entero.");
        setGuardando(false);
        return;
      }

      const ordenCategoriaNumero =
        ordenCategoria.trim() === ""
          ? null
          : Number(ordenCategoria);

      if (
        ordenCategoriaNumero !== null &&
        !Number.isInteger(ordenCategoriaNumero)
      ) {
        setError(
          "El orden de categoría debe ser un número entero."
        );
        setGuardando(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("equipo")
        .update({
          nombre: nombreLimpio,
          grupo: grupo.trim() || null,
          liga: liga.trim() || null,
          etiqueta: etiqueta.trim() || null,
          fecapa,
          idClub: idClubNumero,
          categoria: categoria.trim() || null,
          subgrup: subgrup.trim() || null,
          orden_categoria: ordenCategoriaNumero,
        })
        .eq("id", equipoId);

      if (updateError) {
        throw updateError;
      }

      router.push(`/admin/equipos/${equipoId}`);
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        "No se ha podido guardar el equipo. Inténtalo de nuevo."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/admin/equipos/${equipoId}`}
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
            ← Volver al equipo
          </Link>

          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Cargando equipo...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !equipo) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/admin/equipos"
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
            ← Volver a equipos
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={cargarEquipo}
              className="
                mt-3
                rounded-xl
                bg-red-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-red-700
              "
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/admin/equipos/${equipoId}`}
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
          ← Volver al equipo
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar equipo
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {equipo?.nombre}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Nombre
              </label>

              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
                placeholder="Nombre del equipo"
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Categoría
              </label>

              <input
                id="categoria"
                type="text"
                value={categoria}
                onChange={(e) =>
                  setCategoria(e.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
                placeholder="Ej. Alevín"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="liga"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Liga
                </label>

                <input
                  id="liga"
                  type="text"
                  value={liga}
                  onChange={(e) =>
                    setLiga(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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

              <div>
                <label
                  htmlFor="grupo"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Grupo
                </label>

                <input
                  id="grupo"
                  type="text"
                  value={grupo}
                  onChange={(e) =>
                    setGrupo(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="subgrup"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Subgrupo
                </label>

                <input
                  id="subgrup"
                  type="text"
                  value={subgrup}
                  onChange={(e) =>
                    setSubgrup(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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

              <div>
                <label
                  htmlFor="etiqueta"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Etiqueta
                </label>

                <input
                  id="etiqueta"
                  type="text"
                  value={etiqueta}
                  onChange={(e) =>
                    setEtiqueta(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="idClub"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  ID Club
                </label>

                <input
                  id="idClub"
                  type="number"
                  value={idClub}
                  onChange={(e) =>
                    setIdClub(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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

              <div>
                <label
                  htmlFor="ordenCategoria"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Orden categoría
                </label>

                <input
                  id="ordenCategoria"
                  type="number"
                  value={ordenCategoria}
                  onChange={(e) =>
                    setOrdenCategoria(e.target.value)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
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
            </div>

            <label
              className="
                flex
                cursor-pointer
                items-center
                gap-3
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
              "
            >
              <input
                type="checkbox"
                checked={fecapa}
                onChange={(e) =>
                  setFecapa(e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  FECAPA
                </p>

                <p className="text-xs text-gray-500">
                  Indica si el equipo está asociado a FECAPA.
                </p>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Link
                href={`/admin/equipos/${equipoId}`}
                className="
                  inline-flex
                  justify-center
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                Cancelar
              </Link>

              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="
                  inline-flex
                  justify-center
                  rounded-xl
                  bg-blue-600
                  px-5
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
        </div>
      </div>
    </main>
  );
}
