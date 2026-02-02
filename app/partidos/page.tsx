'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import { useEquipos } from '@/app/context/EquiposContext'
import FiltroPartidos from '@/components/filtroPartidos'
import type { Equipo } from '@/app/types/equipo'

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = async (filtros?: any) => {
    console.log('Filtro:', filtros);
    let query = supabase
      .from('partido')
      .select(`*, equipo:idequipo (categoria, fecapa)`)
      .order('fecha_date', { ascending: true })

    console.log('longitud filtro.equipos:', filtros.equipos.length);
    if (filtros.equipos.length > 0) {
      query = query
        .in('idequipo',filtros.equipos.map((e: { id: number }) => e.id))
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
    setPartidos(data || [])
  }

  useEffect(() => {
    cargarPartidos()
  }, [])

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Partidos</h1>
      
      <FiltroPartidos onFiltrar={cargarPartidos} />

      <div className="space-y-3">
        {partidos.map(p => (
          <PartidoCard key={p.id} partido={p} />
        ))}
      </div>
    </main>
  )
}
