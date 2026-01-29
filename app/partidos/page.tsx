'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import { useEquipos } from '@/app/context/EquiposContext'
import Filtros from '@/components/filtroPartidos'


export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])
  const { equiposSeleccionados } = useEquipos()

  const cargarPartidos = async (filtros?: any) => {
    console.log('Filtro:', filtros);
    let query = supabase
      .from('partido')
      .select('*')
      //.in('equipo_id', filtros.)
      .order('fecha_date', { ascending: true })

    if (equiposSeleccionados.length > 0) {
      query = query
        .in('idequipo', equiposSeleccionados.map(e => e.id))
    }


    if (filtros?.weekend) {
      query = query
        .filter('fecha_date', 'gte', filtros.weekend.start.toISOString().split('T')[0])
        .filter('fecha_date', 'lte', filtros.weekend.end.toISOString().split('T')[0])
    }
    
    console.log("QUERY : " + query);

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
