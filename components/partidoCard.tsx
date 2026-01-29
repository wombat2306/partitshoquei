import { useState } from "react";

export default function PartidoCard({ partido }: any) {
  const [open, setOpen] = useState(false);
        //console.log("Render PartidoCard", partido.id);

  const genero: Record<string, string> = {
    4290: '/fem.png', // Fem13
    4168: '/fem.png', // MiniFem
    4381: '/Mixte.png', // Alevi
    4335: '/MIXT.png', // Enzo
  };
  const categoria: Record<string, string> = {
    4290: '13',
    4168: 'MI',
    4381: 'AL',
    4335: 'AL', // Enzo
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
          src={genero[partido.idliga] ?? '/default.png'} className="w-5 h-5 mx-auto"
          style={{ width: "25px", height: "25px", objectFit: "contain" }} />
       <svg width="30" height="30" viewBox="0 0 100 100" className="flex-shrink-0">
          <circle cx="50" cy="50" r="40"  stroke="black" strokeWidth="3"  fill="white"/>
          <text x="50%" y="50%" textAnchor="middle" fill="red" fontSize="40" fontWeight="bold" dy=".3em" >{categoria[partido.idliga] ?? '??'}</text>
        </svg>
      
      {/* Fecha */}
      <span className="text-xs font-medium text-gray-600">
          {partido.fecha} 
        </span>

        {/* Hora */}
      <span className="text-xs text-gray-600 ">
          {partido.hora}
        </span>

        {/* Iconos */}
        
        <img src={partido.escudolocal} className="w-5 h-5 mx-auto" 
          style={{ width: "25px", height: "25px", objectFit: "contain" }}/>
        <span className="text-xs text-gray-600 "> VS </span>
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