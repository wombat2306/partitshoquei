import { useState, useCallback } from 'react'
import WeekendDropdown from './weekendDropdown'
import { Weekend } from '@/utils/getWeekends'

type Props = {
  onChangeFilters: (filters: any) => void
}

export default function Filtros({ onChangeFilters }: Props) {
  const [weekend, setWeekend] = useState<Weekend | null>(null)

  const handleSelect = useCallback(
    (w: Weekend | null) => {
      setWeekend(w)
      onChangeFilters((prev: any) => ({
        ...prev,
        weekend: w,
      }))
    },
    [onChangeFilters]
  )

  return (
    <div className="p-4 bg-white shadow rounded-xl">
      <div className="flex gap-2 items-center">
        <WeekendDropdown monthsAhead={4} onSelect={handleSelect} />
      </div>
    </div>
  )
}
