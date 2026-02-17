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
  const weekends = useMemo(
    () => getWeekends(monthsAhead),
    [monthsAhead]
  )

  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (!weekends.length) return

    const savedId = localStorage.getItem('selectedWeekendId')

    let weekendToSelect: Weekend | undefined

    // 🔹 1️⃣ Intentar restaurar guardado
    if (savedId) {
      weekendToSelect = weekends.find(w => w.id === savedId)
    }

    const now = new Date()

    // 🔹 2️⃣ Si no hay guardado válido → buscar actual
    if (!weekendToSelect) {
      weekendToSelect = weekends.find(w => {
        const start = new Date(w.start)
        const end = new Date(w.end)
        end.setHours(23, 59, 59, 999)
        return start <= now && end >= now
      })
    }

    // 🔹 3️⃣ Si no estamos en fin de semana → siguiente
    if (!weekendToSelect) {
      weekendToSelect = weekends.find(w => {
        const start = new Date(w.start)
        return start > now
      })
    }

    if (weekendToSelect) {
      setSelectedId(weekendToSelect.id)
      onSelect(weekendToSelect)
      localStorage.setItem('selectedWeekendId', weekendToSelect.id)
    }
  }, [weekends, onSelect])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedId(id)

    const weekend = weekends.find(w => w.id === id) || null
    onSelect(weekend)

    if (id) {
      localStorage.setItem('selectedWeekendId', id)
    } else {
      localStorage.removeItem('selectedWeekendId')
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
