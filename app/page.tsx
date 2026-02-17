'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import Filtros from '@/components/filtros'
import { useEquipos } from '@/app/context/EquiposContext'
import { marcarConflictos } from '@/utils/marcarConflictos'

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [filtros, setFiltros] = useState<any>(null)
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = async (filtrosActuales?: any) => {
    let query = supabase
      .from('partido')
      .select(`*, equipo:idequipo (categoria, fecapa)`)
      .order('fecha_date', { ascending: true })

    // 🔹 Filtro por equipos
    if (equiposSeleccionados.length > 0) {
      query = query.in(
        'idequipo',
        equiposSeleccionados.map(e => e.id)
      )
    }

    // 🔹 Filtro por fin de semana
    if (filtrosActuales?.weekend?.start && filtrosActuales?.weekend?.end) {
      const start = new Date(filtrosActuales.weekend.start)
      const end = new Date(filtrosActuales.weekend.end)
      end.setHours(23, 59, 59, 999)

      query = query
        .filter('fecha_date', 'gte', start.toISOString())
        .filter('fecha_date', 'lte', end.toISOString())
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
  }

  // 🔥 Se ejecuta siempre que cambien filtros o equipos
  useEffect(() => {
    if (!filtros?.weekend) return
    cargarPartidos(filtros)
  }, [filtros])

  useEffect(() => {
    if (!filtros?.weekend) return
    cargarPartidos(filtros)
  }, [equiposSeleccionados])


  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Partidos</h1>

      <Filtros onChangeFilters={setFiltros} />

      <div className="space-y-3">
        {partidos.map(p => (
          <PartidoCard key={p.id} partido={p} />
        ))}
      </div>
    </main>
  )
}
