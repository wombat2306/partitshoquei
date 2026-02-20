'use client'

import { useState, useCallback, useEffect } from 'react'
import WeekendDropdown from './weekendDropdown'
import ModalSelectorEquipos from './ModalSelectorEquipos'
import type { Equipo } from '@/app/types/equipo'
import type { Weekend } from '@/utils/getWeekends'

type Props = {
  onFiltrar: (filters: any) => void
}

export default function FiltroPartidos({ onFiltrar }: Props) {
  const [weekend, setWeekend] = useState<Weekend | null>(null)
  const [fechaFin, setFechaFin] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Equipo[]>([])

  // 🔹 Fecha mínima = 1 día después de weekend.end
  const getMinFechaFin = (w: Weekend) => {
    const min = new Date(w.end)
    min.setDate(min.getDate() + 1)
    return min
  }

  // 🔹 Manejo weekend (igual patrón que el primer componente)
  const handleSelect = useCallback(
    (selectedWeekend: Weekend | null) => {
      setWeekend(selectedWeekend)

      setFechaFin(prevFecha => {
        if (!selectedWeekend) return ''

        if (prevFecha) {
          const minFecha = getMinFechaFin(selectedWeekend)
          if (new Date(prevFecha) < minFecha) {
            return ''
          }
        }

        return prevFecha
      })

      onFiltrar((prev: any) => ({
        ...prev,
        weekend: selectedWeekend,
      }))
    },
    [onFiltrar]
  )

  // 🔹 Manejo fecha fin
  const handleFechaFinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nuevaFechaFin = e.target.value

      if (weekend) {
        const minFecha = getMinFechaFin(weekend)

        if (new Date(nuevaFechaFin) < minFecha) {
          alert('La fecha fin debe ser al menos un día posterior al fin de semana seleccionado')
          return
        }
      }

      setFechaFin(nuevaFechaFin)

      onFiltrar((prev: any) => ({
        ...prev,
        fechaFin: nuevaFechaFin,
      }))
    },
    [weekend, onFiltrar]
  )

  // 🔹 Cuando cambian equipos
  useEffect(() => {
    onFiltrar((prev: any) => ({
      ...prev,
      equipos: seleccionados,
    }))
  }, [seleccionados, onFiltrar])

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
          <WeekendDropdown monthsAhead={4} onSelect={handleSelect} />
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