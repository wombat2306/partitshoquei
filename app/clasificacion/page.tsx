'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ClasificacionCard from '@/components/clasificacionCard'
import { useEquipos } from '@/app/context/EquiposContext'
import LlistatClubs from '@/components/filtroClubs'
import ModalSelectorEquipos from '@/components/ModalSelectorEquipos'
import type { Equipo } from '@/app/types/equipo'

export default function Home() {
    const [clasificacion, setClasificacion] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const [seleccionados, setSeleccionados] = useState<Equipo[]>([])

  const cargarClasificacion = useCallback(async (filtros?: any) => {

    if (seleccionados.length === 0) {
      setClasificacion([]); // opcional: limpiar resultados
      return;
    }
    let query = supabase
        .from('clasificacion')
        .select(`*`)
        .order('posicion', { ascending: true })
        .in('idequipo', seleccionados.map(e => Number(e.id)))
  
      const { data } = await query
      setClasificacion(data || [])
  }, [seleccionados])
  

  useEffect(() => {
    console.log('Equipos seleccionados:', seleccionados)
    cargarClasificacion({ equipo: seleccionados  })
  }, [seleccionados])

  return (
    <main className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Partidos</h1>
      
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 bg-white-600 text-blue border border-blue-500 rounded">
          👥   <span>Selecciona equipo</span>
        </button>
        <ModalSelectorEquipos
            isOpen={open}
            onClose={() => setOpen(false)}
            onConfirm={setSeleccionados}
            modo="directa"
      />
      <div className="flex items-center justify-center gap-2">
        <img 
          src={seleccionados[0]?.fecapa ? '/fecapa.png' : '/ceeb.png'} 
          className="w-6 h-6"
          style={{ objectFit: "contain" }}
        />
        <h2 className="text-lg font-bold">
          {seleccionados[0]?.grupo}
        </h2>
      </div>

      <div className="space-y-3">
        {clasificacion.map(p => (
          <ClasificacionCard key={p.id} filaClasificacion={p} />
        ))}
      </div>
    </main>
  )
}
