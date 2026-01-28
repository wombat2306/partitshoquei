'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Favoritos', icon: '⭐' },
  { href: '/equipos', label: 'Todos', icon: '⚽' },
  { href: '/clasificacion', label: 'Clasificación', icon: '📊' },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function BottomMenu() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
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
