"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Temporada = {
  id: number;
  nombre: string;
  activa: boolean;
};

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
  revisado_por: string | null;
  created_at: string;
  updated_at: string;
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

export default function CuotasAdminPage() {
  const supabase = createClient();

  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);

  const [temporadaId, setTemporadaId] = useState("");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const [importeBase, setImporteBase] = useState("0");

  // null = sin filtro de estado
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editandoImporte, setEditandoImporte] = useState<number | null>(
    null
  );
  const [importeEditado, setImporteEditado] = useState("");

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (!temporadaId) return;

    cargarCuotas();
  }, [temporadaId, mes, anio]);

  async function cargarDatosIniciales() {
    setCargando(true);
    setError(null);

    const [temporadasResult, jugadoresResult] = await Promise.all([
      supabase
        .from("temporada")
        .select("id,nombre,activa")
        .order("fecha_inicio", { ascending: false }),

      supabase
        .from("jugadores")
        .select("id,nombre,apellidos,activo")
        .order("apellidos", { ascending: true })
        .order("nombre", { ascending: true }),
    ]);

    if (temporadasResult.error) {
      setError(temporadasResult.error.message);
      setCargando(false);
      return;
    }

    if (jugadoresResult.error) {
      setError(jugadoresResult.error.message);
      setCargando(false);
      return;
    }

    const temporadasData = (temporadasResult.data ?? []) as Temporada[];
    const jugadoresData = (jugadoresResult.data ?? []) as Jugador[];

    setTemporadas(temporadasData);
    setJugadores(jugadoresData);

    const temporadaActiva = temporadasData.find((t) => t.activa);

    if (temporadaActiva) {
      setTemporadaId(String(temporadaActiva.id));
    } else if (temporadasData.length > 0) {
      setTemporadaId(String(temporadasData[0].id));
    }

    setCargando(false);
  }

  async function cargarCuotas() {
    if (!temporadaId) return;

    const { data, error } = await supabase
      .from("cuota")
      .select("*")
      .eq("idtemporada", Number(temporadaId))
      .eq("anio", anio)
      .eq("mes", mes)
      .order("jugador_id", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setCuotas((data ?? []) as Cuota[]);
  }

  function nombreJugador(jugadorId: number) {
    const jugador = jugadores.find((j) => j.id === jugadorId);

    if (!jugador) {
      return "Jugador desconocido";
    }

    return `${jugador.nombre} ${jugador.apellidos}`.trim();
  }

  function nombreEstado(estado: string | null) {
    switch (estado) {
      case "pagado_ok":
        return "Pagado";

      case "pendiente_revision":
        return "Revisar";

      case "anulada":
        return "Anulada";

      default:
        return "Pendiente";
    }
  }

  function claseEstado(estado: string | null) {
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

  const cuotasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return cuotas.filter((cuota) => {
      const coincideEstado =
        filtroEstado === null || cuota.estado === filtroEstado;

      if (!coincideEstado) {
        return false;
      }

      if (!texto) {
        return true;
      }

      return nombreJugador(cuota.jugador_id).toLowerCase().includes(texto);
    });
  }, [cuotas, filtroEstado, busqueda, jugadores]);

  const estadisticas = useMemo(() => {
    return {
      total: cuotas.length,
      pendientes: cuotas.filter((c) => c.estado === "pendiente").length,
      revision: cuotas.filter(
        (c) => c.estado === "pendiente_revision"
      ).length,
      pagadas: cuotas.filter((c) => c.estado === "pagado_ok").length,
      anuladas: cuotas.filter((c) => c.estado === "anulada").length,
    };
  }, [cuotas]);

  function cambiarFiltroEstado(estado: string) {
    setFiltroEstado((actual) =>
      actual === estado ? null : estado
    );
  }

  async function generarCuotas() {
    if (!temporadaId) {
      setError("Selecciona una temporada.");
      return;
    }

    const importe = Number(importeBase.replace(",", "."));

    if (Number.isNaN(importe) || importe < 0) {
      setError("El importe base no es válido.");
      return;
    }

    setGenerando(true);
    setError(null);

    try {
      const jugadoresActivos = jugadores.filter((j) => j.activo);

      if (jugadoresActivos.length === 0) {
        setError("No hay jugadores activos.");
        return;
      }

      const idsJugadores = jugadoresActivos.map((j) => j.id);

      const { data: cuotasExistentes, error: errorExistentes } =
        await supabase
          .from("cuota")
          .select("jugador_id")
          .eq("idtemporada", Number(temporadaId))
          .eq("anio", anio)
          .eq("mes", mes)
          .eq("tipo", "jugador_equipo")
          .in("jugador_id", idsJugadores);

      if (errorExistentes) {
        throw errorExistentes;
      }

      const existentes = new Set(
        (cuotasExistentes ?? []).map((c) => c.jugador_id)
      );

      const nuevasCuotas = jugadoresActivos
        .filter((jugador) => !existentes.has(jugador.id))
        .map((jugador) => ({
          jugador_id: jugador.id,
          idtemporada: Number(temporadaId),
          anio,
          mes,
          tipo: "jugador_equipo",
          importe,
          motivo: null,
          estado: "pendiente",
        }));

      if (nuevasCuotas.length === 0) {
        setError("Todas las cuotas de este mes ya están creadas.");
        return;
      }

      const { error: errorInsert } = await supabase
        .from("cuota")
        .insert(nuevasCuotas);

      if (errorInsert) {
        throw errorInsert;
      }

      await cargarCuotas();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err
      ) {
        setError(String((err as { message: unknown }).message));
      } else {
        setError("No se han podido generar las cuotas.");
      }
    } finally {
      setGenerando(false);
    }
  }

  async function actualizarCuota(
    cuota: Cuota,
    cambios: Partial<Cuota>
  ) {
    setError(null);

    const { data, error } = await supabase
      .from("cuota")
      .update({
        ...cambios,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cuota.id)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      return false;
    }

    setCuotas((actuales) =>
      actuales.map((item) =>
        item.id === cuota.id ? (data as Cuota) : item
      )
    );

    return true;
  }

  async function marcarPagada(cuota: Cuota) {
    await actualizarCuota(cuota, {
      estado: "pagado_ok",
      fecha_revision:
        cuota.estado === "pendiente_revision"
          ? new Date().toISOString()
          : null,
    });
  }

  async function rechazarPago(cuota: Cuota) {
    await actualizarCuota(cuota, {
      estado: "pendiente",
      fecha_marcado_pago: null,
      metodo_pago: null,
      fecha_revision: null,
      revisado_por: null,
    });
  }

  async function anularCuota(cuota: Cuota) {
    await actualizarCuota(cuota, {
      estado: "anulada",
    });
  }

  async function reactivarCuota(cuota: Cuota) {
    await actualizarCuota(cuota, {
      estado: "pendiente",
    });
  }

  function iniciarEdicionImporte(cuota: Cuota) {
    setEditandoImporte(cuota.id);
    setImporteEditado(String(cuota.importe));
  }

  async function guardarImporte(cuota: Cuota) {
    const importe = Number(importeEditado.replace(",", "."));

    if (Number.isNaN(importe) || importe < 0) {
      setError("El importe no es válido.");
      return;
    }

    const correcto = await actualizarCuota(cuota, {
      importe,
    });

    if (correcto) {
      setEditandoImporte(null);
      setImporteEditado("");
    }
  }

  function cambiarPeriodo(
    nuevoMes: number,
    nuevoAnio: number
  ) {
    setMes(nuevoMes);
    setAnio(nuevoAnio);
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Administración
            </Link>

            <h1 className="mt-1 text-xl font-semibold text-gray-900">
              Cuotas
            </h1>
          </div>
        </div>

        {/* GENERAR */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Generar cuotas
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              Crea una cuota mensual para cada jugador activo que todavía no
              tenga cuota.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                Temporada
              </label>

              <select
                value={temporadaId}
                onChange={(e) => setTemporadaId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-blue-500"
              >
                {temporadas.map((temporada) => (
                  <option key={temporada.id} value={temporada.id}>
                    {temporada.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                Mes
              </label>

              <select
                value={mes}
                onChange={(e) =>
                  cambiarPeriodo(Number(e.target.value), anio)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-blue-500"
              >
                {MESES.map((nombre, index) => (
                  <option key={index + 1} value={index + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                Año
              </label>

              <select
                value={anio}
                onChange={(e) =>
                  cambiarPeriodo(mes, Number(e.target.value))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-blue-500"
              >
                {[anio - 1, anio, anio + 1].map((valor) => (
                  <option key={valor} value={valor}>
                    {valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                Importe
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={importeBase}
                onChange={(e) => setImporteBase(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={generarCuotas}
            disabled={generando}
            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generando
              ? "Generando..."
              : `Generar cuotas de ${MESES[mes - 1]} ${anio}`}
          </button>
        </section>

        {/* ESTADÍSTICAS / FILTROS */}
        <div className="grid grid-cols-4 gap-2">
          {/* PENDIENTES */}
          <button
            type="button"
            onClick={() => cambiarFiltroEstado("pendiente")}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              filtroEstado === "pendiente"
                ? "border-yellow-300 bg-yellow-50 ring-2 ring-yellow-300"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              Pendientes
            </div>

            <div className="text-lg font-semibold text-yellow-600">
              {estadisticas.pendientes}
            </div>
          </button>

          {/* REVISAR */}
          <button
            type="button"
            onClick={() => cambiarFiltroEstado("pendiente_revision")}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              filtroEstado === "pendiente_revision"
                ? "border-orange-300 bg-orange-50 ring-2 ring-orange-300"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              Revisar
            </div>

            <div className="text-lg font-semibold text-orange-600">
              {estadisticas.revision}
            </div>
          </button>

          {/* PAGADAS */}
          <button
            type="button"
            onClick={() => cambiarFiltroEstado("pagado_ok")}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              filtroEstado === "pagado_ok"
                ? "border-green-300 bg-green-50 ring-2 ring-green-300"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              Pagadas
            </div>

            <div className="text-lg font-semibold text-green-600">
              {estadisticas.pagadas}
            </div>
          </button>

          {/* ANULADAS */}
          <button
            type="button"
            onClick={() => cambiarFiltroEstado("anulada")}
            className={`rounded-xl border px-3 py-2 text-left transition ${
              filtroEstado === "anulada"
                ? "border-gray-400 bg-gray-100 ring-2 ring-gray-300"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
              Anuladas
            </div>

            <div className="text-lg font-semibold text-gray-500">
              {estadisticas.anuladas}
            </div>
          </button>
        </div>

        {/* FILTROS */}
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar jugador..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LISTADO */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_90px_85px_105px_68px] items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:grid">
            <div>Jugador</div>
            <div>Mes</div>
            <div>Importe</div>
            <div>Estado</div>
            <div />
          </div>

          {cuotasFiltradas.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No hay cuotas para este periodo.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cuotasFiltradas.map((cuota) => (
                <div
                  key={cuota.id}
                  className="group px-3 py-2.5 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5">
                    {/* JUGADOR */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {nombreJugador(cuota.jugador_id)}
                      </div>

                      <div className="mt-0.5 text-[11px] text-gray-400 sm:hidden">
                        {MESES[cuota.mes - 1]} {cuota.anio}
                      </div>
                    </div>

                    {/* MES */}
                    <div className="hidden w-[90px] shrink-0 text-xs text-gray-500 sm:block">
                      {MESES[cuota.mes - 1]} {cuota.anio}
                    </div>

                    {/* IMPORTE */}
                    <div className="w-[70px] shrink-0 text-right sm:w-[85px] sm:text-left">
                      {editandoImporte === cuota.id ? (
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          step="0.01"
                          value={importeEditado}
                          onChange={(e) =>
                            setImporteEditado(e.target.value)
                          }
                          onBlur={() => guardarImporte(cuota)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              guardarImporte(cuota);
                            }

                            if (e.key === "Escape") {
                              setEditandoImporte(null);
                            }
                          }}
                          className="w-[70px] rounded border border-blue-300 px-1.5 py-1 text-right text-xs outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => iniciarEdicionImporte(cuota)}
                          className="text-xs font-medium text-gray-800 hover:text-blue-600"
                          title="Editar importe"
                        >
                          {Number(cuota.importe).toFixed(2)} €
                        </button>
                      )}
                    </div>

                    {/* ESTADO */}
                    <div className="shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${claseEstado(
                          cuota.estado
                        )}`}
                      >
                        {nombreEstado(cuota.estado)}
                      </span>
                    </div>

                    {/* ACCIONES */}
                    <div className="flex shrink-0 items-center gap-0.5">
                      {cuota.estado === "pendiente" && (
                        <>
                          <button
                            type="button"
                            onClick={() => marcarPagada(cuota)}
                            title="Marcar como pagada"
                            aria-label="Marcar como pagada"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-green-600 transition hover:bg-green-50"
                          >
                            ✓
                          </button>

                          <button
                            type="button"
                            onClick={() => anularCuota(cuota)}
                            title="Anular cuota"
                            aria-label="Anular cuota"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>
                        </>
                      )}

                      {cuota.estado === "pendiente_revision" && (
                        <>
                          <button
                            type="button"
                            onClick={() => marcarPagada(cuota)}
                            title="Confirmar pago"
                            aria-label="Confirmar pago"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-green-600 transition hover:bg-green-50"
                          >
                            ✓
                          </button>

                          <button
                            type="button"
                            onClick={() => rechazarPago(cuota)}
                            title="Rechazar pago"
                            aria-label="Rechazar pago"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            ×
                          </button>
                        </>
                      )}

                      {cuota.estado === "pagado_ok" && (
                        <button
                          type="button"
                          onClick={() => reactivarCuota(cuota)}
                          title="Volver a pendiente"
                          aria-label="Volver a pendiente"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                          ↩
                        </button>
                      )}

                      {cuota.estado === "anulada" && (
                        <button
                          type="button"
                          onClick={() => reactivarCuota(cuota)}
                          title="Reactivar cuota"
                          aria-label="Reactivar cuota"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        >
                          ↩
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INFORMACIÓN SECUNDARIA */}
                  {(cuota.motivo ||
                    cuota.metodo_pago ||
                    cuota.estado === "pendiente_revision") && (
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
                      {cuota.metodo_pago && (
                        <span>
                          {cuota.metodo_pago === "transferencia"
                            ? "Transferencia"
                            : "Tarjeta"}
                        </span>
                      )}

                      {cuota.motivo && (
                        <>
                          <span>·</span>
                          <span className="truncate">{cuota.motivo}</span>
                        </>
                      )}

                      {cuota.estado === "pendiente_revision" && (
                        <span className="font-medium text-orange-600">
                          Pago comunicado por el padre
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
