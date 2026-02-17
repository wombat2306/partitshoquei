'use client'

import { useEffect, useState } from 'react'
import type { Equipo } from '@/app/types/equipo'
import type { Club } from '@/app/types/club'
import { supabase } from '@/lib/supabaseClient'

type ModoSeleccion = 'directa' | 'multiple'
type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (equipos: Equipo[]) => void
  modo: ModoSeleccion
}

export default function ModalSelectorEquipos({
  isOpen,
  onClose,
  onConfirm,
  modo
}: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSeleccionado, setClubSeleccionado] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      const { data: clubsData, error: clubsError } = await supabase
        .from('club')
        .select('id, nombre, urlEscudo')

      if (clubsError) {
        console.error(clubsError)
        return
      }

      setClubs(clubsData || [])

      const { data, error } = await supabase
        .from('equipo')
        .select(`*,
            club (
              id,
              nombre,
              urlEscudo
            )`)
          .order("idClub")
          .order("orden_categoria")
          .order("nombre")

      if (error) {
        console.error('Error cargando equipos:', error)
      } else {
        setEquipos(data ?? [])
      }

      setLoading(false)
    }

    fetchData()
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

  const seleccionarDirecto = (equipo: Equipo) => {
    onConfirm([equipo])
    onClose()
  }

  const equiposFiltrados =
    clubSeleccionado === null
      ? equipos
      : equipos.filter(e => e.idClub === clubSeleccionado)

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

           {/* FILTRO DE CLUB */}
          {/* TODOS */}
          <button
            onClick={() => setClubSeleccionado(null)}
            className={`flex-shrink-0 p-2 rounded-full border-2 ${
              clubSeleccionado === null
                ? 'border-blue-600'
                : 'border-transparent'
            }`}
          >
            <span className="text-sm font-medium">Todos</span>
          </button>

          {clubs.map(club => (
            <button
              key={club.id}
              onClick={() => setClubSeleccionado(club.id)}
              className={`flex-shrink-0 p-1 rounded-full border-2 ${
                clubSeleccionado === club.id
                  ? 'border-blue-600'
                  : 'border-transparent'
              }`}
              title={club.nombre}
            >
              <img
                src={club.urlEscudo}
                alt={club.nombre}
                className="w-10 h-10 object-contain"
                style={{ width: '25px', height: '25px', objectFit: 'contain' }}
              />
            </button>
          ))}


          {!loading && equiposFiltrados.map(equipo => (
            <div
              key={equipo.id}
              className={`grid items-center gap-3 cursor-pointer hover:bg-gray-100 p-1 rounded
                ${
                  modo === 'multiple'
                    ? 'grid-cols-[auto_24px_24px_1fr]'
                    : 'grid-cols-[24px_24px_1fr]'
                }
              `}
              onClick={() => {
                if (modo === 'directa') {
                  seleccionarDirecto(equipo)
                }
              }}
            >
            {modo === 'multiple' && (
              <input
                type="checkbox"
                checked={seleccionados.includes(Number(equipo.id))}
                onChange={() => toggleEquipo(Number(equipo.id))}
                onClick={e => e.stopPropagation()}
              />
        )}
              <img
              src={equipo.fecapa ? '/fecapa.png' : '/ceeb.png'}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
            <img
              src={equipo.club?.urlEscudo || '/placeholder.png'}
              className="w-5 h-5 mx-auto"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />


              {equipo.nombre}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Cancelar
          </button>
          {modo === 'multiple' && (
            <button
              onClick={confirmar}
              className="px-4 py-2 rounded bg-blue-600 text-white"
              disabled={seleccionados.length === 0}
            >
              Confirmar
            </button>
      )}
        </div>
      </div>
    </div>
  )
}
