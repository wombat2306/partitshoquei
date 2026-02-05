/*
function groupMatchesByDay(matches: any[any]) {
  const days: Record<string, any[]> = {}

  matches.forEach(match => {
    const date = new Date(match.date)
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' })

    if (!days[dayName]) days[dayName] = []
    days[dayName].push(match)
  })

  return days
}
*/