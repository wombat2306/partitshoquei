'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Equip = {
  id: number
  nombre: string
  urlEscudo: string
}

export default function LlistatClubs() {
  const [equips, setEquips] = useState<Equip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregarEquips = async () => {
      const { data, error } = await supabase
        .from('club')
        .select('id, nombre, urlEscudo')

      if (error) {
        console.error(error)
      } else if (data) {
        setEquips(data)
      }

      setLoading(false)
    }

    carregarEquips()
  }, [])

  if (loading) {
    return <p className="text-center">Carregant equips…</p>
  }

  return (
    <div className="flex gap-2">
      {equips.map(equip => (
          <img
            src={equip.urlEscudo}
            alt={equip.nombre}
            title={equip.nombre}
            className="h-6 w-6 object-contain hover:scale-110 transition-transform"
          />

      ))}
    </div>
  )
}
