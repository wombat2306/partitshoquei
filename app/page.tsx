'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import Filtros from '@/components/filtros'
import { useEquipos } from '@/app/context/EquiposContext'


export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = async (filtros?: any) => {
    console.log('Filtro:', filtros);
    let query = supabase
      .from('partido')
        .select(`
          *,
          equipo:idequipo (
            categoria,
            fecapa
          )
        `)
      //.in('equipo_id', filtros.)
      .order('fecha_date', { ascending: true })

    if (equiposSeleccionados.length > 0) {
      query = query
        .in('idequipo', equiposSeleccionados.map(e => e.id))
    }

    if (filtros?.weekend) {

      console.log("Weekend start : " + filtros.weekend.start);
      console.log("Weekend end : " + filtros.weekend.end);

      filtros.weekend.end.setHours(23, 59, 59, 999);
      query = query
        .filter('fecha_date', 'gte', filtros.weekend.start.toISOString())
        .filter('fecha_date', 'lte', filtros.weekend.end.toISOString())
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
      <Filtros onFiltrar={cargarPartidos} />

      <div className="space-y-3">
        {partidos.map(p => (
          <PartidoCard key={p.id} partido={p} />
        ))}
      </div>
    </main>
  )
}
