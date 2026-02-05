'use client'

import { useEffect, useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { supabase } from '@/lib/supabaseClient'

type Match = {
  id: string
  local: string
  visitante: string
  date: string
  competition: string
  escudolocal: string
  fecha_date: Date
  escudovisitante: string
    equipo: {
    nombre: string
    }
}

function groupMatchesByDay(matches: Match[]) {
  const days: Record<string, Match[]> = {}


  matches.forEach(match => {
    const date = new Date(match.fecha_date)
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' })

    if (!days[dayName]) days[dayName] = []
    days[dayName].push(match)
  })

  return days
}

export default function SocialAgendaPage() {
  const postRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    async function loadMatches() {
        let query = supabase
            .from('partido')
            .select(`*, equipo:idequipo (nombre, categoria, fecapa)`)
            .order('fecha_date', { ascending: true })
    
        /*
        if (equiposSeleccionados.length > 0) {
            query = query.in('idequipo', equiposSeleccionados.map(e => e.id))
        }
        */
    
        //if (filtros?.weekend) {
            //const start = new Date(filtros.weekend.start)
            //const end = new Date(filtros.weekend.end)
            const start = new Date("2026-02-06")
            const end = new Date("2026-02-08")
            end.setHours(23, 59, 59, 999)
    
            query = query
            .filter('fecha_date', 'gte', start.toISOString())
            .filter('fecha_date', 'lte', end.toISOString())
        //}
    
        const { data } = await query
        setMatches(data || [])
    }
    loadMatches()
  }, [])

  const grouped = groupMatchesByDay(matches)

  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current) return
    const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = name
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 space-y-8">
      <div className="flex gap-4">
        <button
          onClick={() => downloadImage(postRef, 'agenda-post.png')}
          className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold"
        >
          Descargar POST
        </button>

        <button
          onClick={() => downloadImage(storyRef, 'agenda-stories.png')}
          className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-semibold"
        >
          Descargar STORIES
        </button>
      </div>

      {/* ================= POST 1:1 ================= */}
      <div className="flex justify-center">
        <div
          ref={postRef}
          className="w-[1080px] bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-3xl space-y-10"
        >
          <h1 className="text-1xl font-extrabold text-center">
            Partidos del Fin de Semana
          </h1>

          {Object.entries(grouped).map(([day, dayMatches]) => (
            <DayBlock key={day} day={day} matches={dayMatches} />
          ))}
        </div>
      </div>

      {/* ================= STORIES 9:16 ================= */}
      <div className="flex justify-center">
        <div
          ref={storyRef}
          className="w-[1080px] h-[1920px] bg-gradient-to-br from-slate-950 to-slate-900 p-20 rounded-3xl space-y-12"
        >
          <h1 className="text-1xl font-extrabold text-center leading-tight">
            Agenda del<br />Fin de Semana
          </h1>

          {Object.entries(grouped).map(([day, dayMatches]) => (
            <DayBlock key={day} day={day} matches={dayMatches} compact />
          ))}
        </div>
      </div>
    </div>
  )
}

function DayBlock({ day, matches, compact = false }: { day: string, matches: Match[], compact?: boolean }) {
  return (
    <div>
      <h2 className={`font-bold capitalize border-b border-slate-600 pb-2 mb-4 ${compact ? 'text-5xl' : 'text-4xl'}`}>
        {day}
      </h2>

      <div className="space-y-3">
        {matches.map(match => {
          const date = new Date(match.fecha_date)
          const time = date.toLocaleTimeString('ca-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={match.id}
              className="flex justify-between items-center bg-slate-700/60 px-6 py-4 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <img src={match.escudolocal} alt="" className="w-5 h-5 mx-auto" 
                    style={{ width: "25px", height: "25px", objectFit: "contain" }}/>
                <span className={`font-semibold ${compact ? 'text-1xl' : 'text-sm'}`}>
                  {match.local?.toLowerCase().includes('sagrer')
                        ? match.equipo?.nombre
                        : match.local}
                </span>

                <span className="text-slate-400">vs</span>

                <span className={`font-semibold ${compact ? 'text-2xl' : 'text-sm'}`}>
                  {match.visitante?.toLowerCase().includes('sagrer')
                        ? match.equipo?.nombre
                        : match.visitante}
                </span>
                <img src={match.escudovisitante} alt="" className="w-10 h-10 object-contain" />
              </div>

              <div className="text-slate-300 text-sm text-right">
                <div>{time}</div>
                <div className="opacity-70">{match.competition}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

