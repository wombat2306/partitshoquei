'use client'

import { useEffect, useState } from 'react'
import WeekendDropdown from './weekendDropdown'
import LlistatClubs from './filtroClubs'
import ModalSelectorEquipos from './ModalSelectorEquipos'
import type { Equipo } from '@/app/types/equipo'


export default function FiltroPartidos({ onFiltrar }: any) {
  const [weekend, setWeekend] = useState<any>(null)
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [open, setOpen] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Equipo[]>([])


  const handleSelect = (weekend: any) => {
    console.log('Finde seleccionado:', weekend)
    setWeekend(weekend)
  }

  useEffect(() => {
    console.log('Equipos seleccionados:', seleccionados)
  }, [seleccionados])

  //<LlistatClubs onSelect={setClubSeleccionado} />

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setOpen(true)}
          className="px-2 py-1 bg-white-600 text-white border border-blue-500 rounded"
        >
          👥
        </button>
        <ModalSelectorEquipos
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={setSeleccionados}
        />
        <WeekendDropdown monthsAhead={5} onSelect={handleSelect} />
        <button
          onClick={() => onFiltrar({ equipos: seleccionados, weekend })}
          className="bg-blue-600 text-white p-2 rounded"
        >
          🔍
        </button>
      </div>
    </div>
  )
}
