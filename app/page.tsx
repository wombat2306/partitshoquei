'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import PartidoCard from '@/components/partidoCard'
import Filtros from '@/components/filtros'

export default function Home() {
  const [partidos, setPartidos] = useState<any[]>([])

  const cargarPartidos = async (filtros?: any) => {
    let query = supabase
      .from('partido')
      .select('*')
      .order('fecha', { ascending: false })

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
