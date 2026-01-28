'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useEquipos } from '@/app/context/EquiposContext'

type Equipo = {
  id: string
  nombre: string
  fecapa?: boolean
  etiqueta?: string
}

export default function Ajustes() {
  const { equiposSeleccionados, toggleEquipo } = useEquipos()
  const [equipos, setEquipos] = useState<Equipo[]>([])

  useEffect(() => {
    const fetchEquipos = async () => {
      const { data, error } = await supabase.from('equipo').select('*')
      if (error) return console.error(error)
      setEquipos(data || [])
    }
    fetchEquipos()
  }, [])

  const isSelected = (id: string) =>
    equiposSeleccionados.some(e => e.id === id)

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Seleccionar Favoritos</h1>

      {equipos.map(e => (
        <div
          key={e.id}
          className="flex items-center justify-between bg-white p-3 rounded shadow-sm"
        >
          <div className="flex items-center gap-3">
            <img
              src={e.fecapa ? '/fecapa.png' : '/ceeb.png'}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
            <img
              src={e.etiqueta?.toLowerCase().includes("sagrerenc") ? "/sagrerencicon-512.png" : "/ceeb.png"}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
            <span className="font-medium">{e.nombre}</span>
          </div>

          <button
            className={`flex items-center gap-2 px-3 py-1 rounded ${
              isSelected(e.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => toggleEquipo(e)}
          >
            {isSelected(e.id) ? 'Añadido' : 'Añadir'}
            <span className="text-sm">
              {isSelected(e.id) ? '✓' : '+'}
            </span>
          </button>
        </div>
      ))}
    </div>
  )
}
