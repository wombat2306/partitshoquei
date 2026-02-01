'use client'

import { useEffect, useState } from 'react'
import type { Equipo } from '@/app/types/equipo'
import { supabase } from '@/lib/supabaseClient'


type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (equipos: Equipo[]) => void
}

export default function ModalSelectorEquipos({
  isOpen,
  onClose,
  onConfirm
}: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const cargarEquipos = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('equipo')
        .select('*')

      if (error) {
        console.error('Error cargando equipos:', error)
      } else {
        setEquipos(data ?? [])
      }

      setLoading(false)
    }

    cargarEquipos()
  }, [isOpen])

  const toggleEquipo = (id: number) => {
    setSeleccionados(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : [...prev, id]
    )
  }

  const confirmar = () => {
    const result = equipos.filter(e =>
      seleccionados.includes(Number(e.id))
    )
    onConfirm(result)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Selecciona equipos
        </h2>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {loading && <p>Cargando equipos...</p>}

          {!loading && equipos.length === 0 && (
            <p>No hay equipos disponibles</p>
          )}

          {!loading && equipos.map(equipo => (
            <label
              key={equipo.id}
              className="grid grid-cols-[auto_24px_24px_1fr] items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={seleccionados.includes(Number(equipo.id))}
                onChange={() => toggleEquipo(Number(equipo.id))}
              />


              <img
              src={equipo.fecapa ? '/fecapa.png' : '/ceeb.png'}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
            <img
              src={equipo.etiqueta?.toLowerCase().includes("sagrerenc") ? "/sagrerencicon-512.png" : "/cpc.png"}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />


              {equipo.nombre}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className="px-4 py-2 rounded bg-blue-600 text-white"
            disabled={seleccionados.length === 0}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
