'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Equipo = {
  id: string
  nombre: string
  escudo?: string
}

type EquiposContextType = {
  equiposSeleccionados: Equipo[]
  toggleEquipo: (equipo: Equipo) => void
}

const EquiposContext = createContext<EquiposContextType | null>(null)

export function EquiposProvider({ children }: { children: React.ReactNode }) {
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Equipo[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('equiposSeleccionados')
    if (stored) setEquiposSeleccionados(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'equiposSeleccionados',
      JSON.stringify(equiposSeleccionados)
    )
  }, [equiposSeleccionados])

  const toggleEquipo = (equipo: Equipo) => {
    setEquiposSeleccionados(prev => {
      const exists = prev.some(e => e.id === equipo.id)

      if (exists) {
        return prev.filter(e => e.id !== equipo.id)
      }

      return [...prev, equipo]
    })
  }

  return (
    <EquiposContext.Provider value={{ equiposSeleccionados, toggleEquipo }}>
      {children}
    </EquiposContext.Provider>
  )
}

export function useEquipos() {
  const ctx = useContext(EquiposContext)
  if (!ctx) throw new Error('useEquipos debe usarse dentro de EquiposProvider')
  return ctx
}
