"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

type Jugador = {
  id: number;
  nombre: string;
};

type Disponibilidad = {
  jugador_id: number;
  fecha_fin_de_semana: string;
  sabado_manana: boolean;
  sabado_tarde: boolean;
  domingo_manana: boolean;
  domingo_tarde: boolean;
};

type Momento =
  | "sabado_manana"
  | "sabado_tarde"
  | "domingo_manana"
  | "domingo_tarde";

const supabase = createClient();

export default function DisponibilidadPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  const [disponibilidades, setDisponibilidades] =
    useState<Record<string, Disponibilidad>>({});

  const [selectedWeekend, setSelectedWeekend] =
    useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  /*
   * Lunes de la semana actual.
   */
  const inicio = useMemo(() => {
    return startOfWeek(new Date(), {
      weekStartsOn: 1,
    });
  }, []);

  /*
   * Final de la temporada:
   * 30 de junio del año siguiente.
   */
  const fin = useMemo(() => {
    const hoy = new Date();

    return new Date(
      hoy.getFullYear() + 1,
      5,
      30
    );
  }, []);

  /*
   * Sábados que representan cada fin de semana.
   */
  const weekends = useMemo(() => {
    const result: Date[] = [];

    let current = inicio;

    while (current <= fin) {
      if (current.getDay() === 6) {
        result.push(current);
      }

      current = addDays(current, 1);
    }

    return result;
  }, [inicio, fin]);

  /*
   * Cargar jugadores y disponibilidad.
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      /*
       * Usuario autenticado.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "No se ha podido identificar al usuario."
        );

        setLoading(false);
        return;
      }

      /*
       * Hijos del padre.
       */
      const {
        data: relaciones,
        error: relacionesError,
      } = await supabase
        .from("padre_jugador")
        .select("jugador_id")
        .eq("usuario_id", user.id);

      if (relacionesError) {
        console.error(relacionesError);

        setError(
          "No se han podido cargar los jugadores."
        );

        setLoading(false);
        return;
      }

      const jugadorIds =
        relaciones?.map(
          (item) => item.jugador_id
        ) ?? [];

      if (jugadorIds.length === 0) {
        setJugadores([]);
        setLoading(false);
        return;
      }

      /*
       * Información de los jugadores.
       */
      const {
        data: jugadoresData,
        error: jugadoresError,
      } = await supabase
        .from("jugadores")
        .select("id, nombre")
        .in("id", jugadorIds)
        .order("nombre");

      if (jugadoresError) {
        console.error(jugadoresError);

        setError(
          "No se han podido cargar los jugadores."
        );

        setLoading(false);
        return;
      }

      setJugadores(jugadoresData ?? []);

      /*
       * Disponibilidad ya guardada.
       */
      const {
        data: disponibilidadData,
        error: disponibilidadError,
      } = await supabase
        .from("disponibilidad_jugador")
        .select(
          `
            jugador_id,
            fecha_fin_de_semana,
            sabado_manana,
            sabado_tarde,
            domingo_manana,
            domingo_tarde
          `
        )
        .in("jugador_id", jugadorIds)
        .gte(
          "fecha_fin_de_semana",
          format(inicio, "yyyy-MM-dd")
        )
        .lte(
          "fecha_fin_de_semana",
          format(fin, "yyyy-MM-dd")
        );

      if (disponibilidadError) {
        console.error(disponibilidadError);

        setError(
          "No se ha podido cargar la disponibilidad."
        );

        setLoading(false);
        return;
      }

      const mapa: Record<
        string,
        Disponibilidad
      > = {};

      (disponibilidadData ?? []).forEach(
        (item) => {
          const key = `${item.jugador_id}_${item.fecha_fin_de_semana}`;

          mapa[key] = item;
        }
      );

      setDisponibilidades(mapa);

      /*
       * Seleccionar inicialmente el primer
       * fin de semana disponible.
       */
      if (weekends.length > 0) {
        setSelectedWeekend(weekends[0]);
      }

      setLoading(false);
    }

    loadData();
  }, [inicio, fin, weekends]);

  /*
   * Clave interna.
   */
  function getKey(
    jugadorId: number,
    weekend: Date
  ) {
    return `${jugadorId}_${format(
      weekend,
      "yyyy-MM-dd"
    )}`;
  }

  /*
   * Si no existe registro en BD,
   * entendemos que el jugador PUEDE
   * todo el fin de semana.
   *
   * Por defecto todo es TRUE.
   */
  function getDisponibilidad(
    jugadorId: number,
    weekend: Date
  ): Disponibilidad {
    const key = getKey(
      jugadorId,
      weekend
    );

    return (
      disponibilidades[key] ?? {
        jugador_id: jugadorId,

        fecha_fin_de_semana:
          format(
            weekend,
            "yyyy-MM-dd"
          ),

        sabado_manana: true,
        sabado_tarde: true,
        domingo_manana: true,
        domingo_tarde: true,
      }
    );
  }

  /*
   * Cambiar una franja.
   *
   * true  = puede
   * false = no puede
   */
  function toggleMomento(
    jugadorId: number,
    weekend: Date,
    momento: Momento
  ) {
    const key = getKey(
      jugadorId,
      weekend
    );

    const actual =
      getDisponibilidad(
        jugadorId,
        weekend
      );

    setDisponibilidades((prev) => ({
      ...prev,

      [key]: {
        ...actual,

        [momento]:
          !actual[momento],
      },
    }));

    setSaved(false);
  }

  /*
   * Guardar cambios.
   */
  async function guardar() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const filas =
        Object.values(
          disponibilidades
        );

      /*
       * Solo necesitamos guardar aquellos
       * jugadores que tengan AL MENOS una
       * franja en false.
       */
      const paraGuardar =
        filas.filter(
          (item) =>
            !item.sabado_manana ||
            !item.sabado_tarde ||
            !item.domingo_manana ||
            !item.domingo_tarde
        );

      /*
       * Eliminar registros que hayan vuelto
       * a estar completamente disponibles.
       */
      for (const item of filas) {
        const todoDisponible =
          item.sabado_manana &&
          item.sabado_tarde &&
          item.domingo_manana &&
          item.domingo_tarde;

        if (todoDisponible) {
          const {
            error: deleteError,
          } = await supabase
            .from(
              "disponibilidad_jugador"
            )
            .delete()
            .eq(
              "jugador_id",
              item.jugador_id
            )
            .eq(
              "fecha_fin_de_semana",
              item.fecha_fin_de_semana
            );

          if (deleteError) {
            throw deleteError;
          }
        }
      }

      /*
       * Guardar solamente las excepciones.
       */
      if (paraGuardar.length > 0) {
        const {
          error: upsertError,
        } = await supabase
          .from(
            "disponibilidad_jugador"
          )
          .upsert(
            paraGuardar,
            {
              onConflict:
                "jugador_id,fecha_fin_de_semana",
            }
          );

        if (upsertError) {
          throw upsertError;
        }
      }

      setSaved(true);
    } catch (error) {
      console.error(error);

      setError(
        "No se han podido guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Calcular el fin de semana correspondiente
   * a cualquier día seleccionado.
   *
   * Lunes-viernes:
   *   -> sábado de esa semana.
   *
   * Sábado:
   *   -> ese mismo sábado.
   *
   * Domingo:
   *   -> sábado anterior.
   */
  function getWeekendFromDate(
    fecha: Date
  ) {
    if (fecha.getDay() === 6) {
      return fecha;
    }

    if (fecha.getDay() === 0) {
      return subDays(fecha, 1);
    }

    const lunes =
      startOfWeek(fecha, {
        weekStartsOn: 1,
      });

    return addDays(
      lunes,
      5
    );
  }

  /*
   * Fecha mínima seleccionable.
   */
  const fechaMinima = format(
    inicio,
    "yyyy-MM-dd"
  );

  /*
   * Fecha máxima seleccionable.
   */
  const fechaMaxima = format(
    fin,
    "yyyy-MM-dd"
  );

  /*
   * Cuando el usuario selecciona una fecha,
   * calculamos automáticamente su fin de semana.
   */
  function handleDateChange(
    value: string
  ) {
    if (!value) {
      return;
    }

    /*
     * Usamos mediodía para evitar problemas
     * de zona horaria con fechas.
     */
    const fecha = new Date(
      `${value}T12:00:00`
    );

    const weekend =
      getWeekendFromDate(
        fecha
      );

    /*
     * Comprobamos que el sábado calculado
     * exista dentro de nuestra temporada.
     */
    const existe =
      weekends.some(
        (item) =>
          format(
            item,
            "yyyy-MM-dd"
          ) ===
          format(
            weekend,
            "yyyy-MM-dd"
          )
      );

    if (!existe) {
      return;
    }

    setSelectedWeekend(
      weekend
    );

    setSaved(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-5">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-gray-500">
            Cargando disponibilidad...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-28">
      <div className="mx-auto max-w-2xl">

        {/* CABECERA */}

        <button
          type="button"
          onClick={() => router.push("/socios")}
          className="
            mb-4
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
          ← Volver a zona de socios
        </button>


        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Disponibilidad
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Indica cuándo tus hijos{" "}
            <strong>
              NO pueden
            </strong>{" "}
            asistir a los partidos.
          </p>
        </div>

        {/* SELECTOR DE FECHA */}

        <section className="rounded-2xl bg-white p-4 shadow-sm">

          <label
            htmlFor="fecha"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Selecciona una fecha
          </label>

          <input
            id="fecha"
            type="date"
            min={fechaMinima}
            max={fechaMaxima}
            value={
              selectedWeekend
                ? format(
                    selectedWeekend,
                    "yyyy-MM-dd"
                  )
                : ""
            }
            onChange={(e) =>
              handleDateChange(
                e.target.value
              )
            }
            className="
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
              text-base
              font-medium
              text-gray-900
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          />

          <p className="mt-2 text-xs text-gray-400">
            Selecciona cualquier día. Se mostrará
            automáticamente el fin de semana
            correspondiente.
          </p>

        </section>

        {/* FIN DE SEMANA */}

        {selectedWeekend && (
          <section className="mt-6">

            <div className="mb-4">
            {/* 
                <h2 className="text-xl font-bold text-gray-900">
                Fin de semana
                 </h2>
            */}

              <p className="text-base font-bold capitalize text-gray-500">
                {format(
                  selectedWeekend,
                  "EEEE d 'de' MMMM",
                  {
                    locale: es,
                  }
                )}
                </p>
                <p className="text-base font-bold capitalize text-gray-500">
                {format(
                  addDays(
                    selectedWeekend,
                    1
                  ),
                  "EEEE d 'de' MMMM",
                  {
                    locale: es,
                  }
                )}
              </p>
            </div>

            {/* JUGADORES */}

{jugadores.map(
  (jugador) => {
    const disponibilidad =
      getDisponibilidad(
        jugador.id,
        selectedWeekend
      );

    return (
      <div
        key={jugador.id}
        className="mb-3 rounded-2xl bg-white p-3 shadow-sm"
      >

        {/* NOMBRE DEL JUGADOR */}

        <h3 className="mb-3 text-base font-bold text-gray-900">
          {jugador.nombre}
        </h3>

        {/* SÁBADO */}

        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="w-16 shrink-0 text-sm font-semibold text-gray-700">
            Sábado
          </span>

          <div className="flex flex-1 gap-2">

            <MomentoButton
              label="Mañana"
              puede={
                disponibilidad.sabado_manana
              }
              onClick={() =>
                toggleMomento(
                  jugador.id,
                  selectedWeekend,
                  "sabado_manana"
                )
              }
            />

            <MomentoButton
              label="Tarde"
              puede={
                disponibilidad.sabado_tarde
              }
              onClick={() =>
                toggleMomento(
                  jugador.id,
                  selectedWeekend,
                  "sabado_tarde"
                )
              }
            />

          </div>
        </div>

        {/* DOMINGO */}

        <div className="flex items-center justify-between gap-2">
          <span className="w-16 shrink-0 text-sm font-semibold text-gray-700">
            Domingo
          </span>

          <div className="flex flex-1 gap-2">

            <MomentoButton
              label="Mañana"
              puede={
                disponibilidad.domingo_manana
              }
              onClick={() =>
                toggleMomento(
                  jugador.id,
                  selectedWeekend,
                  "domingo_manana"
                )
              }
            />

            <MomentoButton
              label="Tarde"
              puede={
                disponibilidad.domingo_tarde
              }
              onClick={() =>
                toggleMomento(
                  jugador.id,
                  selectedWeekend,
                  "domingo_tarde"
                )
              }
            />

          </div>
        </div>

      </div>
    );
  }
)}


            {/* ERROR */}

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* GUARDADO */}

            {saved && (
              <div className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                Disponibilidad guardada correctamente.
              </div>
            )}

            {/* BOTÓN GUARDAR */}

            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="
                w-full
                rounded-xl
                bg-blue-600
                px-5
                py-4
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {saving
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </section>
        )}

      </div>
    </main>
  );
}

/*
 * Botón de una franja horaria.
 *
 * true  = PUEDE
 * false = NO PUEDE
 */
function MomentoButton({
  label,
  puede,
  onClick,
}: {
  label: string;
  puede: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1
        rounded-lg
        border
        px-2
        py-2
        text-xs
        font-medium
        transition

        ${
          puede
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }
      `}
    >
      <span>
        {label}
      </span>

      <span className="ml-1">
        {puede ? "✓" : "✕"}
      </span>
    </button>
  );
}

