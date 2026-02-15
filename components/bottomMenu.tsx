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
        console.log(formatted)  // 23/05/2026 14:00
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
    </nav>
  )
}
