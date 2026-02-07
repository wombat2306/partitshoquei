import { useState } from "react";

export default function PartidoCard({ partido }: any) {
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

  const [golesLocal, golesVisitante] = partido.resultado
  ? partido.resultado.split("-")
  : ["-", "-"];


  return (

<div className="border-b border-gray-200 px-4 py-3 w-full">

     
    {/* ===== LINEA PRINCIPAL (FIJA) ===== */}
    <div 
      className="flex items-center justify-between gap-3"
      onClick={() => setOpen(!open)}
    >
      <img 
          src={partido.equipo?.fecapa ? '/fecapa.png' : '/ceeb.png'} 
          className="w-5 h-5 mx-auto"
          style={{ width: "25px", height: "25px", objectFit: "contain" }} />
      <img 
          src={'/' + partido.equipo?.categoria + '.png'} className="w-5 h-5 mx-auto"
          style={{ width: "25px", height: "25px", objectFit: "contain" }} />
      
      {/* Fecha   src={categoria[partido.equipo?.categoria] ?? '/default.png'} className="w-5 h-5 mx-auto" */}
      <span className="text-base font-medium text-gray-600">
          {partido.fecha} 
        </span>

        {/* Hora */}
        <span className="text-base text-gray-600 ">
          {partido.hora}
        </span>

        {/* Iconos */}
        
        <img src={partido.escudolocal} className="w-5 h-5 mx-auto" 
          style={{ width: "25px", height: "25px", objectFit: "contain" }}/>
        <span className="text-base text-gray-600 "> VS </span>
        <img src={partido.escudovisitante} className="w-5 h-5 mx-auto" 
          style={{ width: "25px", height: "25px", objectFit: "contain" }}/>

    </div>

      {/* ===== LINEA SECUNDARIA (TOGGLE) ===== */}
    {open && (
    <div className="mt-2 space-y-1 text-sm font-semibold text-gray-800">
    {/* LOCAL */}
    <div className="flex items-center justify-between">
      <span className="truncate">{partido.local}</span>
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
        {golesLocal}
      </span>
    </div>

    {/* VISITANTE */}
    <div className="flex items-center justify-between">
      <span className="truncate">{partido.visitante}</span>
      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
        {golesVisitante}
      </span>
    </div>
  </div>
)}


    </div>


  )
}
                
/* style={{ width: "32px", height: "32px", objectFit: "contain" }} 

<img
          src={partido.escudovisitante}
          alt={partido.visitante}
          className="w-7 h-7 object-contain flex-shrink-0"
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
        />*/