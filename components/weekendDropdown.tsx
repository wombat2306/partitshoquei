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

  // Encuentra el fin de semana actual o el siguiente
  const getCurrentWeekend = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Domingo, 6 = Sábado

    // Si es fin de semana (sábado o domingo), seleccionamos el actual
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return weekends.find((w) => {
        const start = new Date(w.start)
        const end = new Date(w.end)
        return start <= now && end >= now
      })
    } else {
      // Si es entre semana, seleccionamos el siguiente fin de semana
      return weekends.find((w) => {
        const start = new Date(w.start)
        const end = new Date(w.end)
        return start > now // Solo seleccionar el siguiente fin de semana
      })
    }
  }

  // Llamado al montar el componente para restaurar la selección desde localStorage
  useEffect(() => {
    if (!weekends.length) return

    const savedId = localStorage.getItem('selectedWeekendId')

    let weekendToSelect: Weekend | undefined

    if (savedId) {
      weekendToSelect = weekends.find(w => w.id === savedId)
    }

    if (!weekendToSelect) {
      const now = new Date()

      weekendToSelect = weekends.find(w => {
        const start = new Date(w.start)
        const end = new Date(w.end)
        end.setHours(23, 59, 59, 999)

        return (start <= now && end >= now) || start > now
      })
    }

    if (weekendToSelect) {
      setSelectedId(weekendToSelect.id)
      onSelect(weekendToSelect)
    }
  }, [weekends]) // 👈 SOLO weekends


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
