'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient' 
import { format } from 'date-fns'

const items = [
  { href: '/', label: 'Favoritos', icon: '⭐' },
  { href: '/partidos', label: 'Todos', icon: '📅' },
  { href: '/clasificacion', label: 'Clasificación', icon: '🏆' },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️' },
  //{ href: '/social-agenda', label: 'XXSS', icon: '📲' },
]

export default function BottomMenu() {
  const pathname = usePathname()

  const [welcomeText, setWelcomeText] = useState('')

  const [favClicks, setFavClicks] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [showSecret, setShowSecret] = useState(false)


  const handleFavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now()

    setFavClicks(prev => {
      const newCount = now - lastClickTime > 800 ? 1 : prev + 1

      if (newCount === 3) {
        e.preventDefault()
        setShowSecret(true)
        return 0
      }

      return newCount
    })

    setLastClickTime(now)
  }


  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('ejecucionbatch')
        .select('final')
        .order('inicio', { ascending: false })
        .limit(1)

      if (error) {
        console.log('Supabase error:', error)
        return
      }

      console.log('data :', data)
      if (data?.length) {
        const timestamp = data[0].final
        const date = new Date(timestamp)

        const formatted = format(date, 'dd/MM/yyyy HH:mm')
        console.log(formatted) 
        setWelcomeText(formatted)
      }
    }

    loadData()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      {/* FRASE ENCIMA DEL MENÚ */}
      <div className="text-center text-sm text-gray-500 py-1">
        Dades actualitzades el <span className="font-semibold">{welcomeText}</span>
      </div>
      <ul className="flex justify-around">

        {items.map(item => {
          const active = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={item.label === 'Favoritos' ? handleFavClick : undefined}
                className={`flex flex-col items-center py-2 px-3 text-xs ${
                  active
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>


      {showSecret && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSecret(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-72 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">🚀 Menú secreto</h2>
            
            <p className="text-sm text-gray-500 mb-4">
              Has desbloqueado las opciones ocultas
            </p>

            <Link
              href="/social-agenda"
              className="block bg-blue-600 text-white py-2 rounded-lg mb-3"
              onClick={() => setShowSecret(false)}
            >
              Ir a XXSS 📲
            </Link>

            <button
              onClick={() => setShowSecret(false)}
              className="text-sm text-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


    </nav>
  )
}
