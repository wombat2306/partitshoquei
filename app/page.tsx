'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import Filtros from '@/components/filtros'
import { useEquipos } from '@/app/context/EquiposContext'
import { marcarConflictos } from '@/utils/marcarConflictos'

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [filtros, setFiltros] = useState<any>({})
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = useCallback(async (filtros?: any) => {
    let query = supabase
      .from('partido')
      .select(`*, equipo:idequipo (categoria, fecapa)`)
      .order('fecha_date', { ascending: true })

    if (equiposSeleccionados.length > 0) {
      query = query.in('idequipo', equiposSeleccionados.map(e => e.id))
    }

    if (filtros?.weekend) {
      const start = new Date(filtros.weekend.start)
      const end = new Date(filtros.weekend.end)
      end.setHours(23, 59, 59, 999)

      query = query
        .filter('fecha_date', 'gte', start.toISOString())
        .filter('fecha_date', 'lte', end.toISOString())
    }

    const { data } = await query

    if (data) {
      const partidosConConflicto = marcarConflictos(data)
      setPartidos(partidosConConflicto)
    } else {
      setPartidos([])
    }

    //setPartidos(data || [])
  }, [equiposSeleccionados])

  // SOLO se ejecuta cuando hay filtros válidos
  useEffect(() => {
    if (!filtros.weekend) return
    cargarPartidos(filtros)
  }, [filtros, cargarPartidos])

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
