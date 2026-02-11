'use client'

import { useEffect, useState } from 'react'
import WeekendDropdown from './weekendDropdown'
import ModalSelectorEquipos from './ModalSelectorEquipos'
import type { Equipo } from '@/app/types/equipo'
import type { Weekend } from '@/utils/getWeekends'

export default function FiltroPartidos({ onFiltrar }: any) {
  const [weekend, setWeekend] = useState<Weekend | null>(null)
  const [fechaFin, setFechaFin] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Equipo[]>([])

  const handleSelect = (selectedWeekend: Weekend | null) => {
    if (!selectedWeekend) {
      setWeekend(null)
      setFechaFin('')

      onFiltrar({
        weekend: null,
        fechaFin: '',
        equipos: seleccionados
      })

      return
    }

    setWeekend(selectedWeekend)

    if (fechaFin) {
      const minFecha = getMinFechaFin(selectedWeekend)
      if (new Date(fechaFin) < minFecha) {
        setFechaFin('')
      }
    }

    onFiltrar({
      weekend: selectedWeekend,
      fechaFin,
      equipos: seleccionados
    })
  }

  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFechaFin = e.target.value

    if (weekend) {
      const minFecha = getMinFechaFin(weekend)

      if (new Date(nuevaFechaFin) < minFecha) {
        alert('La fecha fin debe ser al menos un día posterior al fin de semana seleccionado')
        return
      }
    }

    setFechaFin(nuevaFechaFin)

    onFiltrar({
      weekend,
      fechaFin: nuevaFechaFin,
      equipos: seleccionados
    })
  }

  useEffect(() => {
    onFiltrar({
      weekend,
      fechaFin,
      equipos: seleccionados
    })
  }, [weekend, fechaFin, seleccionados])

  useEffect(() => {
    if (!weekend) setFechaFin('')
  }, [weekend])


  // 🔹 Fecha mínima = 1 día después de weekend.end
  const getMinFechaFin = (w: Weekend) => {
    const min = new Date(w.end)
    min.setDate(min.getDate() + 1)
    return min
  }

  const minFechaFin = weekend
    ? getMinFechaFin(weekend).toISOString().split('T')[0]
    : undefined

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="grid grid-cols-2 gap-2 items-center">
        <button
          onClick={() => setOpen(true)}
          className="px-2 py-1 border border-blue-500 rounded justify-self-start"
        >
          👥
        </button>

        <ModalSelectorEquipos
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={setSeleccionados}
          modo="multiple"
        />

        <div className="justify-self-end">
          <WeekendDropdown monthsAhead={5} onSelect={handleSelect} />
        </div>

        {weekend && (
          <div className="col-span-2 flex justify-end">
            <input
              type="date"
              value={fechaFin}
              onChange={handleFechaFinChange}
              min={minFechaFin}
              className="border rounded px-2 py-1"
            />
          </div>
        )}

      </div>
    </div>
  )
}
