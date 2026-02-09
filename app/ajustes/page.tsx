'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useEquipos } from '@/app/context/EquiposContext'
import type { Equipo } from '@/app/types/equipo'
import type { Club } from '@/app/types/club'

export default function Ajustes() {
  const { equiposSeleccionados, toggleEquipo } = useEquipos()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSeleccionado, setClubSeleccionado] = useState<number | null>(null)

  
  useEffect(() => {
    const fetchData = async () => {
      const { data: clubsData, error: clubsError } = await supabase
        .from('club')
        .select('id, nombre, urlEscudo')

      if (clubsError) {
        console.error(clubsError)
        return
      }

      setClubs(clubsData || [])

      const { data: equiposData, error: equiposError } = await supabase
        .from('equipo')
        .select(`*,
            club (
              id,
              nombre,
              urlEscudo
            )
          `)

      if (equiposError) {
        console.error(equiposError)
        return
      }

      setEquipos(equiposData || [])
    }

    fetchData()
  }, [])

  
  const isSelected = (id: string) =>
    equiposSeleccionados.some(e => e.id === id)

  const equiposFiltrados =
    clubSeleccionado === null
      ? equipos
      : equipos.filter(e => e.idClub === clubSeleccionado)

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Seleccionar Favoritos</h1>


      {/* FILTRO DE CLUB */}
      {/* TODOS */}
      <button
        onClick={() => setClubSeleccionado(null)}
        className={`flex-shrink-0 p-2 rounded-full border-2 ${
          clubSeleccionado === null
            ? 'border-blue-600'
            : 'border-transparent'
        }`}
      >
        <span className="text-sm font-medium">Todos</span>
      </button>

      {clubs.map(club => (
        <button
          key={club.id}
          onClick={() => setClubSeleccionado(club.id)}
          className={`flex-shrink-0 p-1 rounded-full border-2 ${
            clubSeleccionado === club.id
              ? 'border-blue-600'
              : 'border-transparent'
          }`}
          title={club.nombre}
        >
          <img
            src={club.urlEscudo}
            alt={club.nombre}
            className="w-10 h-10 object-contain"
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
        </button>
      ))}


      {equiposFiltrados.map(e => (
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
              src={e.club?.urlEscudo || '/placeholder.png'}
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
