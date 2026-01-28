'use client'

import { useState } from 'react'

export default function Filtros({ onFiltrar }: any) {
  const [equipo, setEquipo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  return (
    <div className="p-4 bg-white shadow rounded-xl space-y-2">
      <input
        type="text"
        placeholder="Equipo"
        value={equipo}
        onChange={e => setEquipo(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <div className="flex gap-2">
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="border p-2 rounded w-1/2" />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="border p-2 rounded w-1/2" />
      </div>

      <button
        onClick={() => onFiltrar({ equipo, desde, hasta })}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        Filtrar
      </button>
    </div>
  )
}
