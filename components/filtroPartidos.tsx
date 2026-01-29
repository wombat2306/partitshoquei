'use client'

import { useState } from 'react'
import WeekendDropdown from './weekendDropdown'
import LlistatClubs from './filtroClubs'



export default function Filtros({ onFiltrar }: any) {
  const [equipo, setEquipo] = useState('')
  const [weekend, setWeekend] = useState<any>(null)

  const handleSelect = (weekend: any) => {
    console.log('Finde seleccionado:', weekend)
    setWeekend(weekend)
  }

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="flex gap-2 items-center">
        <LlistatClubs />
        <WeekendDropdown monthsAhead={5} onSelect={handleSelect} />
        <button
          onClick={() => onFiltrar({ equipo, weekend })}
          className="bg-blue-600 text-white p-2 rounded"
        >
          🔍
        </button>
      </div>
    </div>
  )
}
