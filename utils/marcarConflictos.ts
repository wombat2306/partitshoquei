export const marcarConflictos = (lista: any[]) => {
    return lista.map((partido, i) => {
      const inicioA = new Date(partido.fecha_date).getTime()

      let conflicto = false

      for (let j = 0; j < lista.length; j++) {
        if (i === j) continue

        const otro = lista[j]
        const inicioB = new Date(otro.fecha_date).getTime()

        const diffHoras = Math.abs(inicioA - inicioB) / (1000 * 60 * 60)

        // Regla 1: menos de 1h siempre conflicto
        if (diffHoras < 1.25) {
          conflicto = true
          break
        }

        // Regla 2: distinto local y menos de 2h
        if (partido.local !== otro.local && diffHoras < 2) {
            //console.log('Local : ', partido.local)
            //console.log('otro  : ', otro.local)
            conflicto = true
            break
        }
      }

      return {
        ...partido,
        conflicto
      }
    })
  }