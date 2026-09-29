"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Equipo = {
  id: number;
  nombre: string;
};

type Temporada = {
  id: number;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

export default function NuevaFasePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const equipoId = Number(params.id);

  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [temporada, setTemporada] =
    useState<Temporada | null>(null);

  const [fase, setFase] = useState("");
  const [liga, setLiga] = useState("");
  const [grupo, setGrupo] = useState("");
  const [subgrupo, setSubgrupo] = useState("");
  const [viva, setViva] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isFinite(equipoId)) {
      setError("El equipo indicado no es válido.");
      setCargando(false);
      return;
    }

    cargarDatos();
  }, [equipoId]);

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const [
        { data: equipoData, error: equipoError },
        { data: temporadaData, error: temporadaError },
      ] = await Promise.all([
        supabase
          .from("equipo")
          .select("id, nombre")
          .eq("id", equipoId)
          .maybeSingle(),

        supabase
          .from("temporada")
          .select(
            `
              id,
              nombre,
              fecha_inicio,
              fecha_fin
            `
          )
          .eq("activa", true)
          .maybeSingle(),
      ]);

      if (equipoError) {
        throw equipoError;
      }

      if (temporadaError) {
        throw temporadaError;
      }

      if (!equipoData) {
        setError("No se ha encontrado el equipo.");
        return;
      }

      if (!temporadaData) {
        setError(
          "No hay una temporada activa. Activa una temporada antes de crear una fase."
        );
        return;
      }

      setEquipo(equipoData);
      setTemporada(temporadaData);

      /*
       * Por defecto utilizamos las fechas de la temporada.
       * El usuario puede modificarlas antes de guardar.
       */
      setFechaInicio(temporadaData.fecha_inicio ?? "");
      setFechaFin(temporadaData.fecha_fin ?? "");

      /*
       * Intentamos proponer el siguiente número de fase.
       */
      const { data: fasesData, error: fasesError } =
        await supabase
          .from("equipo_fase")
          .select("fase")
          .eq("idequipo", equipoId)
          .eq("idtemporada", temporadaData.id)
          .order("fase", {
            ascending: false,
          })
          .limit(1);

      if (fasesError) {
        throw fasesError;
      }

      const ultimaFase =
        fasesData?.[0]?.fase;

      if (
        ultimaFase !== null &&
        ultimaFase !== undefined &&
        Number.isFinite(Number(ultimaFase))
      ) {
        setFase(String(Number(ultimaFase) + 1));
      } else {
        setFase("1");
      }
    } catch (err) {
      console.error(err);

      setError(
        "No se ha podido cargar la información necesaria."
      );
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    if (!temporada) {
      setError("No hay una temporada activa.");
      return;
    }

    const faseNumero =
      fase.trim() === ""
        ? null
        : Number(fase);

    if (
      faseNumero !== null &&
      (!Number.isInteger(faseNumero) ||
        faseNumero < 1)
    ) {
      setError(
        "La fase debe ser un número entero mayor que 0."
      );
      return;
    }

    if (fechaInicio && fechaFin) {
      if (fechaFin < fechaInicio) {
        setError(
          "La fecha de fin no puede ser anterior a la fecha de inicio."
        );
        return;
      }
    }

    setGuardando(true);
    setError("");

    try {
      /*
       * Evitamos crear dos veces la misma fase dentro
       * del mismo equipo y temporada.
       */
      if (faseNumero !== null) {
        const { data: faseExistente, error: faseExistenteError } =
          await supabase
            .from("equipo_fase")
            .select("id")
            .eq("idequipo", equipoId)
            .eq("idtemporada", temporada.id)
            .eq("fase", faseNumero)
            .maybeSingle();

        if (faseExistenteError) {
          throw faseExistenteError;
        }

        if (faseExistente) {
          setError(
            `La Fase ${faseNumero} ya existe para este equipo en la temporada activa.`
          );
          setGuardando(false);
          return;
        }
      }

      const { error: insertError } = await supabase
        .from("equipo_fase")
        .insert({
          idequipo: equipoId,
          idtemporada: temporada.id,
          fase: faseNumero,
          liga: liga.trim() || null,
          grupo: grupo.trim() || null,
          subgrupo: subgrupo.trim() || null,
          viva,
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null,
        });

      if (insertError) {
        throw insertError;
      }

      router.push(`/admin/equipos/${equipoId}`);
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        "No se ha podido guardar la fase. Inténtalo de nuevo."
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
              Cargando...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!equipo || !temporada) {
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

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error ||
                "No se puede crear la fase porque falta información."}
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
            Añadir fase
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {equipo.nombre}
          </p>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Temporada
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            {temporada.nombre}
          </p>

          {(temporada.fecha_inicio ||
            temporada.fecha_fin) && (
            <p className="mt-1 text-sm text-gray-500">
              {temporada.fecha_inicio || "—"} →{" "}
              {temporada.fecha_fin || "—"}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="fase"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Número de fase
              </label>

              <input
                id="fase"
                type="number"
                min="1"
                value={fase}
                onChange={(e) =>
                  setFase(e.target.value)
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
                placeholder="Ej. 1"
              />

              <p className="mt-1 text-xs text-gray-400">
                Se propone automáticamente el siguiente número
                disponible.
              </p>
            </div>

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
                placeholder="Liga"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                  placeholder="Grupo"
                />
              </div>

              <div>
                <label
                  htmlFor="subgrupo"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Subgrupo
                </label>

                <input
                  id="subgrupo"
                  type="text"
                  value={subgrupo}
                  onChange={(e) =>
                    setSubgrupo(e.target.value)
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
                  placeholder="Subgrupo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fechaInicio"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Fecha de inicio
                </label>

                <input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) =>
                    setFechaInicio(e.target.value)
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
                  htmlFor="fechaFin"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Fecha de fin
                </label>

                <input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) =>
                    setFechaFin(e.target.value)
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
                checked={viva}
                onChange={(e) =>
                  setViva(e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Fase activa
                </p>

                <p className="text-xs text-gray-500">
                  Indica si esta fase está actualmente en
                  competición.
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
                  : "Guardar fase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
