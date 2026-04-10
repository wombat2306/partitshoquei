'use client'

import { useEffect, useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { supabase } from '@/lib/supabaseClient'
import Filtros from '@/components/filtros'

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

type Filtros = {
  weekend?: any
  fechaFin?: string
  equipos?: any[]
}

const toBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url)
  const blob = await res.blob()

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

type Format = 'post' | 'story' | 'reel'

const layout = {
  post: {
    header: 'top-[150px] left-[60px] w-[600px] h-[70px] text-4xl',
    local: 'top-[500px] left-[50px] text-[60px]',
    visitante: 'top-[700px] left-[200px] text-[65px]',
    comp: 'bottom-[150px]'
  },
  story: {
    header: 'top-[250px] left-[100px] w-[700px] h-[90px] text-5xl',
    local: 'top-[700px] left-[80px] text-[80px]',
    visitante: 'top-[1000px] left-[200px] text-[90px]',
    comp: 'bottom-[250px]'
  },
  reel: {
    header: 'top-[200px] left-[80px] w-[720px] h-[90px] text-5xl',
    local: 'top-[700px] left-[50px] text-[90px]',
    visitante: 'top-[1000px] left-[300px] text-[100px]',
    comp: 'bottom-[300px]'
  }
}


function groupMatchesByDay(matches: Match[]) {
  const days: Record<string, Match[]> = {}

  matches.forEach(match => {
    const date = new Date(match.fecha_date)
    //const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' })
    const dayName = date.toLocaleDateString('ca-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    if (!days[dayName]) days[dayName] = []
    days[dayName].push(match)
  })

  return days
}

export default function SocialAgendaPage() {
  const postRef = useRef<HTMLDivElement>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filtros, setFiltros] = useState<any>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const [format, setFormat] = useState<Format>('post')
  const [frame, setFrame] = useState(0)
  const [logos, setLogos] = useState<Record<string, string>>({})

  const formatConfig = {
    post: { width: 1080, height: 1350, top: 30, bottom: 10 },
    story: { width: 1080, height: 1920, top: 40, bottom: 10  },
    reel: { width: 1080, height: 1920, top: 50, bottom: 10  }
  }

  const { width, height, top, bottom } = formatConfig[format]
  
  const loadMatches = async (filtrosActuales?: any) => {
      let query = supabase
          .from('partido')
          .select(`*, equipo:idequipo!inner (nombre, categoria, fecapa)`)
          .eq('equipo.idClub', 1)
          .order('fecha_date', { ascending: true })
  
  
      // 🔹 Filtro por fin de semana
      if (filtrosActuales?.weekend?.start && filtrosActuales?.weekend?.end) {
        const start = new Date(filtrosActuales.weekend.start)
        const end = new Date(filtrosActuales.weekend.end)
        end.setHours(23, 59, 59, 999)
  
        query = query
          .filter('fecha_date', 'gte', start.toISOString())
          .filter('fecha_date', 'lte', end.toISOString())
      }
  
      const { data, error } = await query
  
      if (error) {
        console.error(error)
        setMatches([])
        return
      }
  
      setMatches(data || [])

      const allLogos: Record<string, string> = {}

      for (const match of data || []) {
        const localKey = match.escudolocal
        const visitanteKey = match.escudovisitante

        if (!allLogos[localKey]) {
          allLogos[localKey] = await toBase64(
            `/api/image-proxy?url=${encodeURIComponent(localKey)}`
          )
        }

        if (!allLogos[visitanteKey]) {
          allLogos[visitanteKey] = await toBase64(
            `/api/image-proxy?url=${encodeURIComponent(visitanteKey)}`
          )
        }
      }

      setLogos(allLogos)

  }

  const grouped = groupMatchesByDay(matches)
  // 🔥 lista plana ordenada (clave para el reel)
  const allMatchesOrdered = [...matches].sort(
    (a, b) => new Date(a.fecha_date).getTime() - new Date(b.fecha_date).getTime()
  )

  // 🔥 partidos visibles según frame
  const visibleMatches = allMatchesOrdered.slice(0, frame + 1)

  // 🔥 agrupar SOLO los visibles
  const groupedVisible = groupMatchesByDay(visibleMatches)


  const handleDownload = async () => {
    try {

      console.log(slideRefs.current)
      // esperar a que carguen fuentes
      await document.fonts.ready

      for (let i = 0; i < slideRefs.current.length; i++) {
        const node = slideRefs.current[i]
        if (!node) continue

        // 👇 esperar a que carguen imágenes dentro del slide
        const images = node.querySelectorAll('img')

        await Promise.all(
          Array.from(images).map((img) => {
            return new Promise((resolve) => {
              const original = img.src
              img.src = ''
              img.src = original + '&r=' + Math.random()
              img.onload = resolve
              img.onerror = resolve
            })
          })
        )

        const dataUrl = await htmlToImage.toPng(node, {
          cacheBust: true,
          pixelRatio: 1, // 🔥 calidad normal
        })

        const link = document.createElement('a')
        link.download = `slide-${i + 1}.png`
        link.href = dataUrl
        link.click()

        // 👇 pequeña pausa para evitar bugs en descargas múltiples
        await new Promise((res) => setTimeout(res, 300))
      }
    } catch (error) {
      console.error('Error generando imágenes:', error)
    }
  }

  const handleDownloadReelFrames = async () => {
    try {
      const totalFrames = matches.length

      for (let i = 0; i < totalFrames; i++) {
        setFrame(i)
        await new Promise(requestAnimationFrame)
        await new Promise((r) => setTimeout(r, 100))

        // ⏳ esperar a que React renderice
        await new Promise((r) => setTimeout(r, 200))

        const node = slideRefs.current[0] // usamos SLIDE 1

        if (!node) continue

        const dataUrl = await htmlToImage.toPng(node, {
          cacheBust: true,
          pixelRatio: 1,
        })

        const link = document.createElement('a')
        link.download = `reel-frame-${i}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!filtros?.weekend) return
    loadMatches(filtros)
  }, [filtros])

  const [scale, setScale] = useState(1)

 useEffect(() => {
    const updateScale = () => {
      const newScale = Math.min(
        window.innerWidth / width,
        window.innerHeight / height,
        1
      )
      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => window.removeEventListener('resize', updateScale)
  }, [width, height])


  return (
   <div>

      <div className="flex gap-4">
        <Filtros onChangeFilters={setFiltros} />

        <button onClick={handleDownload} className="
          px-3 py-2
          bg-gradient-to-r from-red-900 to-red-500
          text-white
          font-semibold
          rounded-lg
          border border-red-800
          shadow-md
        ">
          Des. imagen
        </button>

        <button
          onClick={handleDownloadReelFrames}
          className="px-3 py-2 bg-black text-white rounded-lg"
        >
          Des. REEL
        </button>

        
        <div className="flex gap-2 mb-4">
          {['post', 'story', 'reel'].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f as Format)}
              className={`
                px-4 py-2 rounded-lg font-semibold
                ${format === f
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-200 text-black'}
              `}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="w-screen h-screen overflow-x-auto flex snap-x snap-mandatory">

        {/* SLIDE 1 */}
        <div className="w-screen h-screen flex-shrink-0 snap-center flex justify-center">

          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            <div
              ref={(el) => {(slideRefs.current[0] = el)}}
              className="
                overflow-hidden
                relative
                bg-no-repeat bg-center bg-contain
              "
              style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundImage: "url('/fondoAzul.jpg')"
              }}
            >
              <div
                className="
                  absolute
                  left-10
                  flex flex-col
                  items-start
                  px-10
                  space-y-10
                  w-full max-w-[1000px]
                "
                style={{
                  top: `${top}%`,
                  bottom: `${bottom}%`
                }}
              >
                {Object.entries(groupedVisible).map(([day, dayMatches]) => (
                  <DayBlock key={day} day={day} matches={dayMatches} logos={logos}/>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* SLIDES PARTIDOS */}
        {Object.entries(grouped).map(([day, dayMatches], dayIndex) =>
          dayMatches.map((match, matchIndex) => {
            const index = dayIndex * 100 + matchIndex + 1

            return (
              <div
                key={match.id}
                ref={(el) => {
                  slideRefs.current[index] = el
                }}
                className="w-screen h-screen flex-shrink-0 snap-center flex justify-center"
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <ReelMatch
                    match={match}
                    day={day}
                    width={width}
                    height={height}
                    format={format}
                  />
                </div>
              </div>
            )
          })
        )}

      </div>

    </div>
  )
}


function DayBlock({ day, matches, compact = false, logos }: { day: string, matches: Match[], compact?: boolean, logos: Record<string, string>}) {
  
  return (
    <div>
    <h2
      className={`
        font-bold capitalize
        text-3xl
        mb-6
        text-white
        bg-gradient-to-r from-red-950 via-red-700 to-red-400
        shadow-xl
        tracking-wide
        font-bebas-neue
        w-[500px] h-[60px]   
        flex items-center    
        px-10
      `}
      style={{
        clipPath: 'polygon(20px 0, 100% 0, calc(100% - 20px) 100%, 0% 100%)'
      }}
    >
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
              className="
                flex items-center gap-4
                px-4 py-2
                border-b border-blue-900/20
                bg-white/60 backdrop-blur-sm
                rounded-lg
                font-inter
              "
            >
              {/* Hora */}
              <span className="text-blue-900 text-3xl font-extrabold">
                {time}
              </span>

              {/* Equipo local 
                src={`/api/image-proxy?url=${encodeURIComponent(match.escudolocal)}`}
              <img
                key={match.id + '-local'}
                src={`/api/image-proxy?url=${encodeURIComponent(match.escudolocal)}&t=${match.id}`}
                alt=""
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
              */}

              <img
                src={logos[match.escudolocal]}
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />

              <span className={`font-extrabold text-blue-900 text-3xl`}>
                {match.local?.toLowerCase().includes('sagrer')
                  ? match.equipo?.nombre
                  : match.local}
              </span>

              {/* VS */}
              <span className="text-blue-900 font-extrabold text-2xl">
                vs
              </span>

              {/* Equipo visitante 
              src={`/api/image-proxy?url=${encodeURIComponent(match.escudovisitante)}`}
                */}
              <span className={`font-extrabold text-blue-900 text-3xl`}>
                {match.visitante?.toLowerCase().includes('sagrer')
                  ? match.equipo?.nombre
                  : match.visitante}
              </span>


              <img
                src={logos[match.escudovisitante]}
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
              {/*
              <img
                key={match.id + '-visitante'}
                src={`/api/image-proxy?url=${encodeURIComponent(match.escudovisitante)}&t=${match.id}`}
                alt=""
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
              */}

            </div>

          )
        })}
      </div>
    </div>
  )
}

const ReelMatch = ({ match, day, width, height, format }: { match: Match, day: string, width: number, height: number, format : Format }) => {  const isLocalSagrer = match.local?.toLowerCase().includes('sagrer')
  const isVisitanteSagrer = match.visitante?.toLowerCase().includes('sagrer')
  return (
    <div
      className="
        relative
        bg-cover bg-center
        text-white
        overflow-hidden
      "
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: "url('/fondoPartidoAzul.png')"
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/30" />

      {/* HEADER (DÍA) */}
      <div
        className={`
          absolute
          ${layout[format].header}
          flex items-center
          px-12
          font-bebas-neue
          text-5xl
          tracking-wide
          bg-gradient-to-r from-red-950 via-red-700 to-red-400
          shadow-xl
        `}
        style={{
          clipPath: 'polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0% 100%)'
        }}
      >
        {day}
      </div>

      {/* top-[200px] left-[80px] w-[720px] h-[90px] */} 
      {/* EQUIPO LOCAL */}

      {/* className="absolute top-[700px] left-[50px]" */}
      <div
        className={`absolute ${layout[format].local}`}
        style={{ transform: 'rotate(-20deg)' }}
      >
        <span className={`
            font-black 
            leading-none
            ${isLocalSagrer ? 'text-[90px]' : 'text-[80px]'}
            ${isLocalSagrer ? 'text-[#E8B81D]' : 'text-white'}`}>
          {match.local?.toLowerCase().includes('sagrer')
            ? match.equipo?.nombre
            : match.local}
        </span>
      </div>

      {/* EQUIPO VISITANTE */}

        {/* className="absolute top-[1000px] left-[300px]" */}
      <div
        className={`absolute ${layout[format].visitante}`}
        style={{ transform: 'rotate(-20deg)' }}
      >
        <span className={`
            font-black 
            leading-none
            ${isVisitanteSagrer ? 'text-[90px]' : 'text-[80px]'}
            ${isVisitanteSagrer ? 'text-[#E8B81D]' : 'text-white'}`}
          style={{
            textShadow: '0 5px 20px rgba(0,0,0,0.6)'
          }}>
          VS &nbsp;
          {match.visitante?.toLowerCase().includes('sagrer')
            ? match.equipo?.nombre
            : match.visitante}
        </span>
      </div>

      {/* PISTA */}
      <div className="absolute bottom-[200px] left-[50%] -translate-x-1/2 text-xl opacity-70">
        {/* {match.pista} */}
      </div>
    </div>
  )
}



