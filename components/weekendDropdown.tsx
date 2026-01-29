// components/WeekendDropdown.tsx
'use client'

import { useMemo, useState } from 'react'
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
  const [selectedId, setSelectedId] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      console.log('change fired', e.target.value)

    const id = e.target.value
    setSelectedId(id)

    const weekend = weekends.find(w => w.id === id) || null
      console.log('weekend found:', weekend)

    onSelect(weekend)
  }

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="border rounded px-3 py-2"
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
