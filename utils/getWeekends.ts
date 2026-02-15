export type Weekend = {
  id: string
  start: Date
  end: Date
  label: string
}

export function getWeekends(monthsAhead = 6): Weekend[] {
  const weekends: Weekend[] = []
  const today = new Date()
  const endDate = new Date()
  endDate.setMonth(today.getMonth() + monthsAhead)

  const current = new Date(today)
  current.setDate(current.getDate() - 10)

  while (current <= endDate) {
    if (current.getDay() === 6) { // sábado
      const saturday = new Date(current)

      // viernes 00:00
      const friday = new Date(saturday)
      friday.setDate(saturday.getDate() - 1)
      friday.setHours(0, 0, 0, 0)

      // domingo 23:59:59
      const sunday = new Date(saturday)
      sunday.setDate(saturday.getDate() + 1)
      sunday.setHours(23, 59, 59, 999)

      weekends.push({
        id: friday.toISOString().split('T')[0], // id por fecha del viernes
        start: friday,
        end: sunday,
        label: `${friday.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })} - ${sunday.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })}`,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return weekends
}
