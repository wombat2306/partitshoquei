"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Jugador = {
  id: number;
  nombre: string;
  apellidos: string;
  activo: boolean;
};

type Cuota = {
  id: number;
  jugador_id: number;
  idtemporada: number;
  anio: number;
  mes: number;
  tipo: string;
  importe: number;
  motivo: string | null;
  estado: string;
  metodo_pago: string | null;
  fecha_marcado_pago: string | null;
  fecha_revision: string | null;
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function CuotasSocioPage() {
  const supabase = createClient();

  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);

  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<number | null>(
    null
  );

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enviandoPago, setEnviandoPago] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
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
        throw new Error("No se ha podido identificar al usuario.");
      }

      const { data: relaciones, error: relacionesError } = await supabase
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
        setJugadores([]);
        setCuotas([]);
        return;
      }

      const [jugadoresResult, cuotasResult] = await Promise.all([
        supabase
          .from("jugadores")
          .select("id,nombre,apellidos,activo")
          .in("id", idsJugadores)
          .order("apellidos", { ascending: true })
          .order("nombre", { ascending: true }),

        supabase
          .from("cuota")
          .select("*")
          .in("jugador_id", idsJugadores)
          .order("anio", { ascending: false })
          .order("mes", { ascending: false }),
      ]);

      if (jugadoresResult.error) {
        throw jugadoresResult.error;
      }

      if (cuotasResult.error) {
        throw cuotasResult.error;
      }

      const jugadoresData = (jugadoresResult.data ?? []) as Jugador[];
      const cuotasData = (cuotasResult.data ?? []) as Cuota[];

      setJugadores(jugadoresData);
      setCuotas(cuotasData);

      if (jugadoresData.length > 0) {
        setJugadorSeleccionado(jugadoresData[0].id);
      }
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se han podido cargar las cuotas.");
      }
    } finally {
      setCargando(false);
    }
  }

  const cuotasJugador = useMemo(() => {
    if (!jugadorSeleccionado) {
      return [];
    }

    return cuotas.filter(
      (cuota) => cuota.jugador_id === jugadorSeleccionado
    );
  }, [cuotas, jugadorSeleccionado]);

  // RESUMEN DE TODOS LOS HIJOS
  const resumenCuotas = useMemo(() => {
    const pendientes = cuotas.filter(
      (cuota) => cuota.estado === "pendiente"
    );

    const comunicadas = cuotas.filter(
      (cuota) => cuota.estado === "pendiente_revision"
    );

    const pagadas = cuotas.filter(
      (cuota) => cuota.estado === "pagado_ok"
    );

    return {
      pendientesNumero: pendientes.length,
      pendientesImporte: pendientes.reduce(
        (total, cuota) => total + Number(cuota.importe),
        0
      ),

      comunicadasNumero: comunicadas.length,
      comunicadasImporte: comunicadas.reduce(
        (total, cuota) => total + Number(cuota.importe),
        0
      ),

      pagadasNumero: pagadas.length,
      pagadasImporte: pagadas.reduce(
        (total, cuota) => total + Number(cuota.importe),
        0
      ),
    };
  }, [cuotas]);

  function nombreEstado(estado: string) {
    switch (estado) {
      case "pagado_ok":
        return "Pagada";

      case "pendiente_revision":
        return "Pago comunicado";

      case "anulada":
        return "Anulada";

      default:
        return "Pendiente";
    }
  }

  function claseEstado(estado: string) {
    switch (estado) {
      case "pagado_ok":
        return "bg-green-50 text-green-700";

      case "pendiente_revision":
        return "bg-orange-50 text-orange-700";

      case "anulada":
        return "bg-gray-100 text-gray-500";

      default:
        return "bg-yellow-50 text-yellow-700";
    }
  }

  async function comunicarPago(cuota: Cuota) {
    setEnviandoPago(cuota.id);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("cuota")
        .update({
          estado: "pendiente_revision",
          metodo_pago: "transferencia",
          fecha_marcado_pago: new Date().toISOString(),
          fecha_revision: null,
          revisado_por: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cuota.id)
        .eq("estado", "pendiente")
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      setCuotas((actuales) =>
        actuales.map((item) =>
          item.id === cuota.id ? (data as Cuota) : item
        )
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se ha podido comunicar el pago.");
      }
    } finally {
      setEnviandoPago(null);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            Cargando cuotas...
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
            Mis cuotas
          </h1>

          <p className="mt-0.5 text-xs text-gray-500">
            Consulta las cuotas de tus jugadores y comunica sus pagos.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SIN JUGADORES */}
        {jugadores.length === 0 ? (
          <section className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <div className="text-sm font-medium text-gray-900">
              No tienes jugadores vinculados
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Cuando tengas un jugador vinculado a tu cuenta, sus cuotas
              aparecerán aquí.
            </p>
          </section>
        ) : (
          <>
        {/* RESUMEN GENERAL */}
        <section className="grid grid-cols-3 gap-2">
        {/* PENDIENTES */}
        <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Pendientes
            </div>

            <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-semibold text-gray-900">
                {resumenCuotas.pendientesNumero}
            </span>
            <span className="text-[10px] text-gray-500">
                cuotas
            </span>
            </div>
        </div>

        {/* COMUNICADAS */}
        <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Comunicadas
            </div>

            <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-semibold text-orange-600">
                {resumenCuotas.comunicadasNumero}
            </span>
            <span className="text-[10px] text-gray-500">
                cuotas
            </span>
            </div>
        </div>

        {/* PAGADAS */}
        <div className="rounded-xl bg-white px-3 py-3 shadow-sm">
            <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Pagadas
            </div>

            <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-semibold text-green-600">
                {resumenCuotas.pagadasNumero}
            </span>
            <span className="text-[10px] text-gray-500">
                cuotas
            </span>
            </div>
        </div>
        </section>

            {/* SELECTOR DE JUGADORES */}
            {jugadores.length > 1 && (
              <section className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Jugador
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {jugadores.map((jugador) => {
                    const seleccionado =
                      jugador.id === jugadorSeleccionado;

                    return (
                      <button
                        key={jugador.id}
                        type="button"
                        onClick={() =>
                          setJugadorSeleccionado(jugador.id)
                        }
                        className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${
                          seleccionado
                            ? "bg-blue-600 font-medium text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {jugador.nombre}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* JUGADOR */}
            {jugadorSeleccionado && (
              <div className="px-1">
                <h2 className="text-sm font-semibold text-gray-900">
                  {(() => {
                    const jugador = jugadores.find(
                      (j) => j.id === jugadorSeleccionado
                    );

                    return jugador
                      ? `${jugador.nombre} ${jugador.apellidos}`.trim()
                      : "";
                  })()}
                </h2>
              </div>
            )}

            {/* CUOTAS */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {cuotasJugador.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No hay cuotas disponibles.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cuotasJugador.map((cuota) => (
                    <div key={cuota.id} className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {MESES[cuota.mes - 1]} {cuota.anio}
                          </div>

                          <div className="mt-0.5 text-[11px] text-gray-400">
                            Cuota mensual
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {Number(cuota.importe).toFixed(2)} €
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${claseEstado(
                              cuota.estado
                            )}`}
                          >
                            {nombreEstado(cuota.estado)}
                          </span>
                        </div>
                      </div>

                      {cuota.estado === "pendiente" && (
                        <button
                          type="button"
                          onClick={() => comunicarPago(cuota)}
                          disabled={enviandoPago === cuota.id}
                          className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {enviandoPago === cuota.id
                            ? "Comunicando..."
                            : "Comunicar pago"}
                        </button>
                      )}

                      {cuota.estado === "pendiente_revision" && (
                        <div className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-[11px] text-orange-700">
                          Pago comunicado. Pendiente de revisión por la
                          administración.
                        </div>
                      )}

                      {cuota.metodo_pago && (
                        <div className="mt-1.5 text-[10px] text-gray-400">
                          Método: Transferencia
                        </div>
                      )}
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
