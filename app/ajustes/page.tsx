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
  const [openSection, setOpenSection] = useState<'favoritos' | 'leyenda' | null>(null)
  
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

      <h1 className="text-xl font-bold cursor-pointer">Ajustes</h1>

      <h1
        className="text-xl font-bold cursor-pointer flex items-center justify-between 
             hover:text-blue-600 transition-colors select-none"
        onClick={() =>
          setOpenSection(openSection === 'favoritos' ? null : 'favoritos')
        }
      >
        Seleccionar Favoritos
        <span className="text-lg">
          {openSection === 'favoritos' ? '➖' : '➕'}
        </span>
      </h1>

      {/* CONTENIDO 1 */}
      {openSection === 'favoritos' && (
      <>
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
      </>
      )}

       <h1
        className="text-xl font-bold cursor-pointer flex items-center justify-between 
             hover:text-blue-600 transition-colors select-none"
        onClick={() =>
          setOpenSection(openSection === 'leyenda' ? null : 'leyenda')
        }
        >Leyenda
          <span className="text-lg">
            {openSection === 'leyenda' ? '➖' : '➕'}
          </span>
        </h1>

      {/* CONTENIDO 2 */}
      {openSection === 'leyenda' && (
        <div className="border-b border-gray-200 px-4 py-3 w-full">

          {/* partido conflico horario */}
          <div className="border-b border-gray-200 px-3 py-2 w-full border-l-[5px] border-red-500 px-3 py-2 mb-3">
            <span className="text-sm font-semibold text-red-700">
              Partido con conflicto horario
            </span>
          </div>
          {/* partido cambio horario ultimos 15 dias */}
          <div className="border-b border-gray-200 px-3 py-2 w-full border-l-[5px] border-yellow-400 px-3 py-2 mb-3">
            <span className="text-sm font-semibold text-yellow-700">
              Cambio horario hace menos de 15 días
            </span>
          </div>
          {/* Grid leyenda */}
          <div className="grid grid-cols-[40px_1fr] gap-2 items-center">
            <img 
                src='/fecapa.png' 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Lliga Federació </span>
            <img 
                src='/ceeb.png' 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Lliga Consell</span>
            <img 
                src={'/prebe.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Mixte Prebenjami</span>
            <img 
                src={'/benjamin.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Mixte Benjami</span>
            <img 
                src={'/alevi.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Mixte Alevi</span>
            <img 
                src={'/infantil.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Mixte Infantil</span>
            <img 
                src={'/minifem.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Mini Femeni</span>
            <img 
                src={'/fem11.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Femeni 11</span>
            <img 
                src={'/fem13.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Femeni 13</span>
            <img 
                src={'/fem15.png'} 
                className="w-8 h-8"
                style={{ width: "25px", height: "25px", objectFit: "contain" }} />
            <span className="text-base font-medium text-gray-600">Femeni 15</span>
          </div>
        </div>
      )}


    </div>

  )
}
