'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import { useEquipos } from '@/app/context/EquiposContext'
import FiltroPartidos from '@/components/filtroPartidos'
import { marcarConflictos } from '@/utils/marcarConflictos'

type Filtros = {
  weekend?: any
  fechaFin?: string
  equipos?: any[]
}

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = useCallback(async (filtrosActuales?: Filtros | null) => {
    let query = supabase
      .from('partido')
      .select(`*, equipo:idequipo (categoria, fecapa)`)
      .order('fecha_date', { ascending: true })

    // 🔹 Filtro por equipos (desde filtros del componente)
    if (filtrosActuales?.equipos && filtrosActuales.equipos.length > 0) {
      query = query.in(
        'idequipo',
        filtrosActuales.equipos.map((e: { id: number }) => e.id)
      )
    }

    // 🔹 Filtro por fin de semana
    if (filtrosActuales?.weekend?.start && filtrosActuales?.weekend?.end) {
      const start = new Date(filtrosActuales.weekend.start)
      const end = new Date(filtrosActuales.weekend.end)
      end.setHours(23, 59, 59, 999)

      query = query.filter('fecha_date', 'gte', start.toISOString())

      if (filtrosActuales?.fechaFin) {
        const end2 = new Date(filtrosActuales.fechaFin)
        end2.setHours(23, 59, 59, 999)
        query = query.filter('fecha_date', 'lte', end2.toISOString())
      } else {
        query = query.filter('fecha_date', 'lte', end.toISOString())
      }
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      setPartidos([])
      return
    }

    if (data) {
      setPartidos(marcarConflictos(data))
    } else {
      setPartidos([])
    }
  }, [])

  // 🔥 Se ejecuta cuando cambian los filtros
  useEffect(() => {
    if (!filtros?.weekend) return
    cargarPartidos(filtros)
  }, [filtros, cargarPartidos])

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Partidos</h1>

      {/* 🔥 Ahora igual que el primer page */}
      <FiltroPartidos onFiltrar={setFiltros} />

      <div className="space-y-3">
        {partidos.map(p => (
          <PartidoCard key={p.id} partido={p} />
        ))}
      </div>
    </main>
  )
}
