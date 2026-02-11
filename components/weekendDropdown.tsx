'use client'

import { useMemo, useState, useEffect } from 'react'
import { getWeekends, Weekend } from '@/utils/getWeekends'

type Props = {
  monthsAhead?: number
  onSelect: (weekend: Weekend | null) => void
}

export default function WeekendDropdown({
  monthsAhead = 6,
  onSelect,
}: Props) {
  const weekends = useMemo(() => getWeekends(monthsAhead), [monthsAhead])
  const [selectedId, setSelectedId] = useState<string>('')

  // Encuentra el fin de semana actual
  const getCurrentWeekend = () => {
    const now = new Date()
    return weekends.find((w) => {
      const start = new Date(w.start) // Asegúrate de que `startDate` esté en el formato correcto
      const end = new Date(w.end)
      return start <= now && end >= now
    })
  }

  // Llamado al montar el componente para restaurar la selección desde localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('selectedWeekendId') // Recuperamos el ID guardado
    const currentWeekend = getCurrentWeekend()

    if (savedId && savedId !== selectedId) {
      // Si hay un valor guardado y es diferente al seleccionado actual, lo restauramos
      setSelectedId(savedId) 
      const selectedWeekend = weekends.find(w => w.id === savedId)
      if (selectedWeekend) {
        onSelect(selectedWeekend) // Notificamos al componente padre con el fin de semana restaurado
      }
    } else if (!savedId && currentWeekend && selectedId !== currentWeekend.id) {
      // Si no hay valor guardado, seleccionamos el fin de semana actual solo una vez
      setSelectedId(currentWeekend.id) // Seleccionamos el fin de semana actual por defecto
      onSelect(currentWeekend) // Llamamos a onSelect para notificar el fin de semana actual
    }
  }, [weekends, selectedId, onSelect]) // Se ejecuta solo cuando `weekends` cambia o si `selectedId` cambia

  // Maneja el cambio de selección y lo guarda en localStorage
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedId(id)

    const weekend = weekends.find(w => w.id === id) || null
    onSelect(weekend) // Llamamos a onSelect con el fin de semana seleccionado

    // Guardamos la selección en localStorage
    if (id) {
      localStorage.setItem('selectedWeekendId', id)
    } else {
      localStorage.removeItem('selectedWeekendId') // Si se selecciona "Cap de setmana", eliminamos el valor
    }
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="border rounded px-2 py-2"
    >
      <option value="">Cap de setmana</option>

      {weekends.map(w => (
        <option key={w.id} value={w.id}>
          {w.label}
        </option>
      ))}
    </select>
  )
}
