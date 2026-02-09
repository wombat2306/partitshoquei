import { Club } from "./club"

export type Equipo = {
  id: string
  nombre: string
  fecapa?: boolean
  etiqueta?: string
  grupo?: string
  idClub?: number
  club?: Club
}
