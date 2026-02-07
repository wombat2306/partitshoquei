import { useState } from "react";

export default function ClasificacionCard({ filaClasificacion }: any) {
  const [open, setOpen] = useState(false);
        //console.log("Render PartidoCard", partido.id);

  const liga: Record<string, string> = {
    ceeb: '/ceeb.png',
    fecapa: '/fecapa.png'
  };
  const categoria: Record<string, string> = {
    femSr: '/fem13.png', 
    fem13: '/fem13.png', 
    minifem: '/femMini.png', 
    alevi: '/alevi.png', 
    prebe: '/prebe.png', 
  };


  return (

<div className="border-b border-gray-200 px-4 py-3 w-full">

     
    {/* ===== LINEA PRINCIPAL (FIJA) ===== */}
    <div 
      className="grid grid-cols-[15px_25px_1fr_15px] items-center gap-4"
      onClick={() => setOpen(!open)}
    >
        <span className="text-base font-medium text-gray-600">
          {filaClasificacion.posicion} 
        </span>

        {/* Iconos */}
        <img src={filaClasificacion.escudo} className="w-5 h-5 mx-auto" 
          style={{ width: "25px", height: "25px", objectFit: "contain" }}/>
        {/* equipo */}
        <span className="text-base font-medium text-gray-600 ">
          {filaClasificacion.equipo}
        </span>
        <span className="text-base font-medium text-gray-600">
          {filaClasificacion.puntos} 
        </span>
    </div>

      {/* ===== LINEA SECUNDARIA (TOGGLE) ===== */}
    {open && (
    <div className="mt-2 text-base font-semibold text-gray-800">
  <div className="grid grid-cols-7 gap-2 items-center">
    <div>
      <span className="text-base text-gray-600">p.jug</span>
      <div className="text-base items-center">{filaClasificacion.pjugados}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">p.gan</span>
      <div className="truncate">{filaClasificacion.pganados}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">p.emp</span>
      <div className="truncate">{filaClasificacion.pempatados}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">p.per</span>
      <div className="truncate">{filaClasificacion.pperdidos}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">g.fav</span>
      <div className="truncate">{filaClasificacion.gfavor}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">g.con</span>
      <div className="truncate">{filaClasificacion.gcontra}</div>
    </div>

    <div>
      <span className="text-base text-gray-600">san</span>
      <div className="truncate">{filaClasificacion.sanciones}</div>
    </div>
  </div>
</div>

)}
    </div>

  )
}
