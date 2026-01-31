import { useState } from 'react'
import WeekendDropdown from './weekendDropdown'

export default function Filtros({ onChangeFilters }: any) {
  const [weekend, setWeekend] = useState<any>(null)

  const handleSelect = (w: any) => {
    setWeekend(w)
    onChangeFilters({ weekend: w })
  }

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="flex gap-2 items-center">
        <WeekendDropdown monthsAhead={5} onSelect={handleSelect} />
      </div>
    </div>
  )
}
