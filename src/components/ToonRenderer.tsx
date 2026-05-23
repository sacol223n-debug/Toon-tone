import React, { useState, useEffect } from "react";

interface ToonRendererProps {
  characterId: string;
  userColor: string;
  showOriginal: boolean;
  isMasked: boolean;
}

/**
 * Función de utilidad que verifica si una imagen local existe de forma asíncrona.
 * Crea un elemento de imagen temporal en memoria para probar la carga exitosa del archivo.
 * 
 * @param src Ruta de la imagen local a verificar (ej. "/images/characters/homer.png")
 * @returns Promesa que resuelve a true si la imagen se cargó correctamente, o false si falló.
 */
export const checkLocalImageExists = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

export const ToonRenderer: React.FC<ToonRendererProps> = ({
  characterId,
  userColor,
  showOriginal,
  isMasked,
}) => {
  const [imageExists, setImageExists] = useState<boolean | null>(null);
  
  // Ruta estándar de imagen local según el id del personaje
  const localImgPath = `/images/characters/${characterId}.png`;

  useEffect(() => {
    let active = true;
    setImageExists(null); // Resetear estado al transicionar personajes
    
    checkLocalImageExists(localImgPath).then((exists) => {
      if (active) {
        setImageExists(exists);
      }
    });

    return () => {
      active = false;
    };
  }, [characterId, localImgPath]);

  // Common fallback style to desaturate slate or keep original
  const getFill = (original: string, fallbackGray = "#94A3B8") => {
    if (showOriginal) return original;
    if (isMasked) return userColor;
    return fallbackGray;
  };

  // Si la imagen local existe, la renderizamos aplicando filtros en memoria
  if (imageExists === true) {
    return (
      <div className="relative w-full h-full max-h-[350px] flex flex-col items-center justify-center p-4 bg-[#0e1424] rounded-[32px] border border-white/5 overflow-hidden">
        {/* Destello de fondo decorativo de la consola */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-pink-500/10 blur-xl pointer-events-none" />
        
        <img 
          src={localImgPath} 
          alt={`Personaje ${characterId}`} 
          className="max-h-[220px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-300"
          style={{
            filter: showOriginal 
              ? "none" 
              : isMasked 
                ? `drop-shadow(0 0 8px ${userColor})` // Brillo de color de usuario
                : "grayscale(100%) opacity(0.85)"
          }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-3 right-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono px-2 py-0.5 rounded-lg uppercase tracking-widest font-black">
          Imagen PNG
        </div>
      </div>
    );
  }

  // De lo contrario (imageExists === false o null mientras carga), rendera nuestro vector de alta fidelidad SVG
  // como el placeholder visual más pulido posible, decorado con una etiqueta informativa.
  const vectorBadge = imageExists === false ? (
    <div className="absolute bottom-2 right-2 bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[8px] font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider font-extrabold select-none">
      Vector Falback
    </div>
  ) : null;

  switch (characterId) {
    case "homer": {
      const skin = getFill("#FED41D");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            {/* Background subtle glow */}
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            
            {/* Homer's Collar (Shirt) */}
            <path d="M 60,200 L 140,200 L 150,230 L 50,230 Z" fill="#E2E8F0" />
            <path d="M 60,200 L 80,230 L 100,205 L 120,230 L 140,200 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
            
            {/* Neck */}
            <rect x="75" y="150" width="50" height="55" fill={skin} stroke="#000" strokeWidth="3.5" />
            
            {/* Head & Dome */}
            <path d="M 75,120 C 75,45 125,45 125,120 Z" fill={skin} stroke="#000" strokeWidth="3.5" />
            <rect x="75" y="110" width="50" height="45" fill={skin} />
            
            {/* Hair on side (zig zags) */}
            <path d="M 75,115 L 68,122 L 75,129 M 75,133 L 68,140 L 75,147" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            {/* Hair on top (two curves) */}
            <path d="M 94,50 C 90,30 102,25 102,46" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 103,48 C 100,20 115,20 110,48" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />

            {/* Beard / Muzzle (brownish) */}
            <path d="M 70,165 C 65,130 135,130 130,165 C 130,195 70,195 70,165 Z" fill="#D1B280" stroke="#000" strokeWidth="3.5" />
            
            {/* Mouth line */}
            <path d="M 85,172 C 100,180 115,180 120,172" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            
            {/* Ear */}
            <path d="M 75,145 C 65,145 65,158 75,158" fill={skin} stroke="#000" strokeWidth="3.5" />
            <path d="M 71,151 C 67,151 68,154 72,154" fill="none" stroke="#000" strokeWidth="3" />

            {/* Eyes */}
            <circle cx="93" cy="118" r="21" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
            <circle cx="123" cy="118" r="21" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
            
            {/* Pupils */}
            <circle cx="96" cy="118" r="4.5" fill="#000" />
            <circle cx="120" cy="118" r="4.5" fill="#000" />

            {/* Nose */}
            <path d="M 108,126 Q 120,126 114,138 Q 106,138 108,126" fill={skin} stroke="#000" strokeWidth="3.5" />
          </svg>
          {vectorBadge}
        </div>
      );
    }
    
    case "goofy": {
      const hat = getFill("#3FA34D");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
          
          {/* Goofy's Ears (Long Black floppy ears) */}
          <path d="M 45,115 C 30,125 15,160 30,195 C 40,215 50,190 50,160 Z" fill="#1E293B" />
          <path d="M 155,115 C 170,125 185,160 170,195 C 160,215 150,190 150,160 Z" fill="#1E293B" />

          {/* Goofy's Snout/Muzzle */}
          <path d="M 60,115 C 50,140 50,185 100,185 C 150,185 150,140 140,115 C 120,105 80,105 60,115 Z" fill="#F87171" stroke="#000" strokeWidth="3.5" opacity="0.15" />
          <path d="M 60,135 C 50,150 50,180 100,180 C 150,180 150,150 140,135 C 130,125 70,125 60,135 Z" fill="#FDE047" stroke="#000" strokeWidth="3.5" />

          {/* Teeth (Two cute white squares) */}
          <rect x="85" y="178" width="12" height="12" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />
          <rect x="103" y="178" width="12" height="12" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />

          {/* Eyes (Tall ovals) */}
          <ellipse cx="85" cy="98" rx="14" ry="24" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          <ellipse cx="115" cy="98" rx="14" ry="24" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          
          {/* Pupils */}
          <ellipse cx="87" cy="100" rx="4" ry="9" fill="#000" />
          <ellipse cx="113" cy="100" rx="4" ry="9" fill="#000" />

          {/* Nose (Floppy black oval) */}
          <ellipse cx="100" cy="138" rx="18" ry="10" fill="#1E293B" stroke="#000" strokeWidth="3" />
          {/* Highlight on nose */}
          <ellipse cx="94" cy="134" rx="4" ry="2" fill="#FFF" opacity="0.8" />

          {/* Cheek folds */}
          <path d="M 60,142 C 60,142 55,150 58,155" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 140,142 C 140,142 145,150 142,155" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />

          {/* Goofy's Hat (Classic tall green hat with black brim band) */}
          {/* Hat body */}
          <path d="M 80,72 C 72,50 64,25 90,20 C 110,18 128,24 120,72 Z" fill={hat} stroke="#000" strokeWidth="3.5" />
          {/* Center crease fold */}
          <path d="M 100,20 C 95,40 105,50 100,72" fill="none" stroke="#000" strokeWidth="2.5" opacity="0.6" strokeDasharray="3 3" />
          
          {/* Black band bone */}
          <ellipse cx="100" cy="72" rx="32" ry="7" fill="#1E293B" stroke="#000" strokeWidth="3.5" />
          <ellipse cx="100" cy="74" rx="22" ry="5" fill="#4B5563" />
        </svg>
      );
    }
    
    case "dexter": {
      const gloves = getFill("#9333EA");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />

          {/* Hair (Big orange retro spike) */}
          <path d="M 40,100 C 20,40 110,10 160,50 C 170,60 180,95 150,110 C 140,115 130,90 120,95 C 100,100 80,85 60,110 Z" fill="#EA580C" stroke="#000" strokeWidth="4" />

          {/* Face */}
          <path d="M 60,110 C 60,160 120,165 135,140 C 145,120 145,100 135,95 Z" fill="#FFEDD5" stroke="#000" strokeWidth="3.5" />
          <path d="M 135,115 C 148,115 151,123 138,126" stroke="#000" strokeWidth="3.5" fill="#FFEDD5" /> {/* Nose */}

          {/* Mouth */}
          <path d="M 100,142 Q 115,152 120,138" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />

          {/* Huge Blue Science Glasses */}
          <rect x="52" y="85" width="45" height="40" rx="10" fill="#06B6D4" stroke="#000" strokeWidth="4" />
          <rect x="97" y="85" width="45" height="40" rx="10" fill="#06B6D4" stroke="#000" strokeWidth="4" />
          {/* Glass glare */}
          <path d="M 58,90 L 88,115" stroke="#FFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
          <path d="M 103,90 L 133,115" stroke="#FFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

          {/* Lab Coat / Body */}
          <path d="M 60,160 L 140,160 L 145,215 L 55,215 Z" fill="#F1F5F9" stroke="#000" strokeWidth="3.5" />
          {/* Lab Coat middle line buttons */}
          <line x1="100" y1="160" x2="100" y2="215" stroke="#000" strokeWidth="3" />
          <circle cx="93" cy="180" r="3" fill="#000" />
          <circle cx="93" cy="198" r="3" fill="#000" />

          {/* Boots */}
          <rect x="65" y="215" width="26" height="15" rx="5" fill="#111827" stroke="#000" strokeWidth="3" />
          <rect x="109" y="215" width="26" height="15" rx="5" fill="#111827" stroke="#000" strokeWidth="3" />

          {/* GLOVES / Target (Scientific rubber gloves!) */}
          {/* Left Glove */}
          <path d="M 58,162 C 40,165 32,185 45,195 C 50,198 56,180 58,172 Z" fill={gloves} stroke="#000" strokeWidth="3.5" />
          {/* Right Glove holding a test tube flask */}
          <path d="M 142,162 C 160,165 168,185 155,195 C 150,198 144,180 142,172 Z" fill={gloves} stroke="#000" strokeWidth="3.5" />
          {/* Flask */}
          <path d="M 148,150 L 158,150 L 158,160 L 168,180 L 142,180 Z" fill="#EC4899" fillOpacity="0.8" stroke="#1E293B" strokeWidth="2" />
        </svg>
      );
    }
    
    case "spongebob": {
      const tie = getFill("#DC2626");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />

          {/* Spongebody - yellow rectangle */}
          <rect x="45" y="45" width="110" height="120" rx="8" fill="#FDE047" stroke="#000" strokeWidth="3.5" />

          {/* Sponge craters/holes */}
          <circle cx="60" cy="65" r="8" fill="#CA8A04" opacity="0.4" />
          <circle cx="135" cy="70" r="10" fill="#CA8A04" opacity="0.4" />
          <circle cx="132" cy="140" r="6" fill="#CA8A04" opacity="0.4" />
          <circle cx="62" cy="138" r="9" fill="#CA8A04" opacity="0.4" />

          {/* Big eyes */}
          <circle cx="78" cy="90" r="21" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          <circle cx="122" cy="90" r="21" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          
          {/* Irises blue */}
          <circle cx="82" cy="92" r="9" fill="#0EA5E9" stroke="#000" strokeWidth="2" />
          <circle cx="118" cy="92" r="9" fill="#0EA5E9" stroke="#000" strokeWidth="2" />
          
          {/* Pupils black */}
          <circle cx="83" cy="93" r="4.5" fill="#000" />
          <circle cx="117" cy="93" r="4.5" fill="#000" />

          {/* Nose protruding */}
          <path d="M 94,103 Q 100,90 106,103" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 93,103 C 93,103 98,118 107,103" fill="#FDE047" stroke="#000" strokeWidth="3.5" />

          {/* Smile and cheeks */}
          <path d="M 62,112 C 75,130 125,130 138,112" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cheek circles pink */}
          <ellipse cx="61" cy="112" rx="6" ry="4" fill="#F87171" opacity="0.6" />
          <ellipse cx="139" cy="112" rx="6" ry="4" fill="#F87171" opacity="0.6" />
          {/* Cute Sponge Teeth */}
          <rect x="88" y="119" width="10" height="12" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />
          <rect x="102" y="119" width="10" height="12" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />

          {/* Clothes separator */}
          {/* White shirt belt */}
          <rect x="45" y="165" width="110" height="15" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          
          {/* Brown pants belt */}
          <rect x="45" y="180" width="110" height="20" fill="#78350F" stroke="#000" strokeWidth="3.5" />
          <rect x="58" y="186" width="14" height="4" fill="#111827" />
          <rect x="93" y="186" width="14" height="4" fill="#111827" />
          <rect x="128" y="186" width="14" height="4" fill="#111827" />

          {/* Collars (Twin triangles) */}
          <polygon points="70,165 85,165 80,175" fill="#FFF" stroke="#000" strokeWidth="2.5" />
          <polygon points="130,165 115,165 120,175" fill="#FFF" stroke="#000" strokeWidth="2.5" />

          {/* RED CORBATA (TIE) - TARGET */}
          <polygon points="93,172 107,172 110,192 100,205 90,192" fill={tie} stroke="#000" strokeWidth="3" />
        </svg>
      );
    }
    
    case "finn": {
      const backpack = getFill("#15803D");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />

          {/* Backpack body peaking in the background */}
          <rect x="50" y="125" width="100" height="60" rx="15" fill={backpack} stroke="#000" strokeWidth="3.5" />
          <ellipse cx="100" cy="125" rx="50" ry="10" fill="#22C55E" opacity="0.3" />

          {/* Finn's Hood (white hood with stubby ears) */}
          <path d="M 60,60 C 50,80 50,130 100,130 C 150,130 150,80 140,60 C 135,35 65,35 60,60 Z" fill="#FFFFFF" stroke="#000" strokeWidth="4" />
          {/* Hood Ears */}
          <path d="M 63,45 C 55,30 72,25 72,42 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          <path d="M 137,45 C 145,30 128,25 128,42 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />

          {/* Face opening (oval cutout) */}
          <ellipse cx="100" cy="85" rx="30" ry="24" fill="#FFD1B3" stroke="#000" strokeWidth="3.5" />
          
          {/* Eyes (simple black beads) */}
          <circle cx="90" cy="83" r="3.5" fill="#000" />
          <circle cx="110" cy="83" r="3.5" fill="#000" />
          
          {/* Mouth (happy open crescent or dash) */}
          <path d="M 94,92 Q 100,98 106,92" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />

          {/* Blue Costume Body */}
          <path d="M 64,130 L 136,130 L 140,210 L 60,210 Z" fill="#38BDF8" stroke="#000" strokeWidth="4" />

          {/* Backpack Straps (Wrapping over shoulders) */}
          <path d="M 72,130 Q 82,165 74,195" fill="none" stroke={backpack} strokeWidth="12" strokeLinecap="round" />
          <path d="M 72,130 Q 82,165 74,195" fill="none" stroke="#000" strokeWidth="12" strokeLinecap="round" opacity="0.25" />
          <path d="M 72,130 Q 82,165 74,195" fill="none" stroke={backpack} strokeWidth="9" strokeLinecap="round" />

          <path d="M 128,130 Q 118,165 126,195" fill="none" stroke={backpack} strokeWidth="12" strokeLinecap="round" />
          <path d="M 128,130 Q 118,165 126,195" fill="none" stroke="#000" strokeWidth="12" strokeLinecap="round" opacity="0.25" />
          <path d="M 128,130 Q 118,165 126,195" fill="none" stroke={backpack} strokeWidth="9" strokeLinecap="round" />

          {/* Arm lines */}
          <path d="M 64,140 C 50,160 50,180 52,205" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 136,140 C 150,160 150,180 148,205" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    }
    
    case "mickey": {
      const shorts = getFill("#E11D48");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />

          {/* Mickey's Face skin background */}
          <path d="M 60,115 C 50,80 150,80 140,115 C 135,145 65,145 60,115 Z" fill="#FEE2E2" stroke="#000" strokeWidth="3.5" />

          {/* Black Head overlay & Ears */}
          {/* Back ear left */}
          <circle cx="55" cy="55" r="28" fill="#1A1A1A" stroke="#000" strokeWidth="4" />
          {/* Back ear right */}
          <circle cx="145" cy="55" r="28" fill="#1A1A1A" stroke="#000" strokeWidth="4" />
          {/* Head crown */}
          <path d="M 60,100 C 65,40 135,40 140,100 C 110,85 90,85 60,100 Z" fill="#1A1A1A" stroke="#000" strokeWidth="3.5" />

          {/* Oval Eyes */}
          <ellipse cx="88" cy="100" rx="9" ry="18" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
          <ellipse cx="112" cy="100" rx="9" ry="18" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
          {/* Pupils */}
          <ellipse cx="90" cy="102" rx="3.5" ry="9" fill="#000" />
          <ellipse cx="110" cy="102" rx="3.5" ry="9" fill="#000" />

          {/* Nose snout */}
          <ellipse cx="100" cy="120" rx="12" ry="7" fill="#000" />

          {/* Smile */}
          <path d="M 72,126 Q 100,145 128,126" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cheek laugh lines */}
          <path d="M 70,123 Q 66,128 72,131" fill="none" stroke="#000" strokeWidth="2.5" />
          <path d="M 130,123 Q 134,128 128,131" fill="none" stroke="#000" strokeWidth="2.5" />

          {/* Body black */}
          <rect x="80" y="152" width="40" height="30" fill="#1A1A1A" stroke="#000" strokeWidth="3.5" />

          {/* MICKEY RED SHORTS - TARGET */}
          <path d="M 70,175 C 70,162 130,162 130,175 L 132,215 H 68 Z" fill={shorts} stroke="#000" strokeWidth="4" />
          
          {/* Two Big Oval Buttons (White/Yellow) */}
          <ellipse cx="88" cy="195" rx="7" ry="11" fill="#FEF08A" stroke="#000" strokeWidth="2.5" />
          <ellipse cx="112" cy="195" rx="7" ry="11" fill="#FEF08A" stroke="#000" strokeWidth="2.5" />
        </svg>
      );
    }
    
    case "bubbles": {
      const dress = getFill("#38BDF8");
      return (
        <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
          <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />

          {/* Head Peach */}
          <circle cx="100" cy="105" r="52" fill="#FFEDD5" stroke="#000" strokeWidth="4" />

          {/* Bubbles Yellow Pigtails */}
          <circle cx="48" cy="74" r="22" fill="#FDE047" stroke="#000" strokeWidth="4" />
          <circle cx="152" cy="74" r="22" fill="#FDE047" stroke="#000" strokeWidth="4" />
          {/* Hair ties blue */}
          <rect x="52" y="80" width="8" height="12" rx="3" fill="#3B82F6" stroke="#000" strokeWidth="2" />
          <rect x="140" y="80" width="8" height="12" rx="3" fill="#3B82F6" stroke="#000" strokeWidth="2" />

          {/* Bubbles cute bangs contour */}
          <path d="M 48,105 C 60,65 140,65 152,105 C 130,75 70,75 48,105 Z" fill="#FDE047" stroke="#000" strokeWidth="3.5" />

          {/* Huge Powerpuff Eyes */}
          <circle cx="74" cy="115" r="20" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          <circle cx="126" cy="115" r="20" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
          
          {/* Inside blue eyes */}
          <circle cx="78" cy="115" r="13" fill="#38BDF8" stroke="#000" strokeWidth="2.5" />
          <circle cx="122" cy="115" r="13" fill="#38BDF8" stroke="#000" strokeWidth="2.5" />
          {/* Pupils black */}
          <circle cx="80" cy="115" r="8" fill="#000" />
          <circle cx="120" cy="115" r="8" fill="#000" />
          {/* Eye shines white */}
          <circle cx="77" cy="112" r="3" fill="#FFF" />
          <circle cx="117" cy="112" r="3" fill="#FFF" />
          <circle cx="83" cy="118" r="1.5" fill="#FFF" />
          <circle cx="123" cy="118" r="1.5" fill="#FFF" />

          {/* Small smile */}
          <path d="M 96,132 Q 100,136 104,132" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />

          {/* Body/Dress (Target light blue dress) */}
          <path d="M 82,157 L 118,157 L 124,198 L 76,198 Z" fill={dress} stroke="#000" strokeWidth="4" />
          {/* Black Belt */}
          <rect x="79" y="172" width="42" height="8" fill="#111827" stroke="#000" strokeWidth="2.5" />

          {/* Cute white legs */}
          <rect x="84" y="198" width="10" height="20" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
          <rect x="106" y="198" width="10" height="20" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
          {/* Black shoes */}
          <ellipse cx="89" cy="218" rx="7" ry="4" fill="#000" />
          <ellipse cx="111" cy="218" rx="7" ry="4" fill="#000" />
        </svg>
      );
    }
    
    case "crocker": {
      const skin = getFill("#EAD0BC");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            {/* White shirt and black tie */}
            <path d="M 75,170 L 125,170 L 130,220 L 70,220 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
            <path d="M 92,170 L 100,220 L 108,170 Z" fill="#000" />
            {/* Hunchback shoulder */}
            <path d="M 60,180 C 40,160 50,140 70,160 Z" fill={skin} stroke="#000" strokeWidth="3" />
            {/* Neck */}
            <rect x="85" y="120" width="30" height="50" fill={skin} stroke="#000" strokeWidth="3" />
            {/* Weird ear on neck */}
            <circle cx="85" cy="145" r="10" fill={skin} stroke="#000" strokeWidth="3" />
            <circle cx="85" cy="145" r="4" fill="none" stroke="#000" strokeWidth="2" />
            {/* Long thin head */}
            <path d="M 80,60 C 80,30 135,30 135,60 L 135,120 C 135,130 80,130 80,120 Z" fill={skin} stroke="#000" strokeWidth="3.5" />
            {/* Black flat hair on top */}
            <path d="M 78,55 C 80,35 138,35 140,55 L 140,40 L 78,40 Z" fill="#1C1917" stroke="#000" strokeWidth="3" />
            {/* Big glasses */}
            <rect x="70" y="65" width="32" height="24" rx="4" fill="none" stroke="#000" strokeWidth="4" />
            <rect x="106" y="65" width="32" height="24" rx="4" fill="none" stroke="#000" strokeWidth="4" />
            <line x1="102" y1="77" x2="106" y2="77" stroke="#000" strokeWidth="4" />
            {/* Blue eyes eyes inside */}
            <circle cx="86" cy="77" r="5" fill="#38BDF8" />
            <circle cx="86" cy="77" r="2" fill="#000" />
            <circle cx="122" cy="77" r="5" fill="#38BDF8" />
            <circle cx="122" cy="77" r="2" fill="#000" />
            {/* Angry thick eyebrows */}
            <line x1="68" y1="58" x2="102" y2="68" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="138" y1="58" x2="104" y2="68" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            {/* Prominent chin and underbite mouth */}
            <path d="M 88,110 Q 110,120 130,110" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <line x1="100" y1="110" x2="105" y2="105" stroke="#000" strokeWidth="2.5" />
            <line x1="108" y1="110" x2="113" y2="105" stroke="#000" strokeWidth="2.5" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    case "crocker_dress": {
      const dress = getFill("#EF4444");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            {/* Skinny body wearing a scarlet dress */}
            <path d="M 80,165 C 75,190 65,210 75,230 L 125,230 C 135,210 125,190 120,165 Z" fill={dress} stroke="#000" strokeWidth="3.5" />
            {/* Under-shadow of chest cleavage */}
            <path d="M 90,165 C 95,178 105,178 110,165" fill="none" stroke="#000" strokeWidth="2.5" />
            {/* Pearl Necklace */}
            <circle cx="88" cy="160" r="4" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <circle cx="95" cy="162" r="4" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <circle cx="102" cy="163" r="4" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <circle cx="109" cy="162" r="4" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <circle cx="116" cy="160" r="4" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            {/* Skinny Neck */}
            <rect x="90" y="115" width="20" height="40" fill="#EAD0BC" stroke="#000" strokeWidth="3" />
            {/* Weird ear on neck */}
            <circle cx="90" cy="135" r="8" fill="#EAD0BC" stroke="#000" strokeWidth="2.5" />
            <circle cx="90" cy="135" r="3" fill="none" stroke="#000" strokeWidth="1.5" />
            {/* Crocker long head */}
            <path d="M 80,55 C 80,25 135,25 135,55 L 135,115 C 135,125 80,125 80,115 Z" fill="#EAD0BC" stroke="#000" strokeWidth="3.5" />
            {/* Black flat hair with pink beauty ribbon! */}
            <path d="M 78,50 C 80,30 138,30 140,50 L 140,35 L 78,35 Z" fill="#1C1917" stroke="#000" strokeWidth="3" />
            <ellipse cx="140" cy="40" rx="6" ry="6" fill="#F472B6" stroke="#000" strokeWidth="2" />
            {/* Big glasses */}
            <rect x="70" y="60" width="32" height="24" rx="4" fill="none" stroke="#000" strokeWidth="4" />
            <rect x="106" y="60" width="32" height="24" rx="4" fill="none" stroke="#000" strokeWidth="4" />
            <line x1="102" y1="72" x2="106" y2="72" stroke="#000" strokeWidth="4" />
            {/* Blue eyes */}
            <circle cx="86" cy="72" r="4" fill="#38BDF8" />
            <circle cx="122" cy="72" r="4" fill="#38BDF8" />
            {/* Red lipstick for Crocker! */}
            <path d="M 92,108 C 96,115 104,115 108,108" fill="#EF4444" stroke="#000" strokeWidth="2" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    case "cosmo_wanda": {
      const cosmoHair = getFill("#22C55E");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            
            {/* --- COSMO (LEFT SIDE) --- */}
            {/* Crown */}
            <polygon points="40,25 45,15 50,22 55,15 60,25" fill="#FBBF24" stroke="#000" strokeWidth="2" />
            {/* Green Hair */}
            <path d="M 30,65 C 25,45 65,40 68,65" fill={cosmoHair} stroke="#000" strokeWidth="3" />
            {/* Cosmo Face Piece */}
            <circle cx="48" cy="75" r="18" fill="#FEE2E2" stroke="#000" strokeWidth="3" />
            {/* Hair covering top */}
            <path d="M 32,70 Q 48,55 64,70 Q 48,60 32,70" fill={cosmoHair} />
            {/* Big green eye */}
            <circle cx="44" cy="74" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
            <circle cx="44" cy="74" r="3" fill="#22C55E" />
            <circle cx="44" cy="74" r="1.2" fill="#000" />
            <circle cx="54" cy="74" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
            <circle cx="54" cy="74" r="3" fill="#22C55E" />
            <circle cx="54" cy="74" r="1.2" fill="#000" />
            {/* Mouth */}
            <path d="M 42,85 Q 49,90 54,83" fill="none" stroke="#000" strokeWidth="2.5" />
            {/* Shirt & Tie */}
            <path d="M 38,93 L 58,93 L 55,120 L 41,120 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />
            <line x1="48" y1="93" x2="48" y2="120" stroke="#000" strokeWidth="1.5" />
            <polygon points="46,95 50,95 51,105 48,110 45,105" fill="#000" />
            {/* Tiny magical wings */}
            <ellipse cx="28" cy="98" rx="8" ry="4" fill="#93C5FD" stroke="#000" strokeWidth="1.5" opacity="0.8" />
            
            {/* --- WANDA (RIGHT SIDE) --- */}
            {/* Crown */}
            <polygon points="140,25 145,15 150,22 155,15 160,25" fill="#FBBF24" stroke="#000" strokeWidth="2" />
            {/* Pink Curly Hair */}
            <circle cx="138" cy="50" r="12" fill="#EC4899" stroke="#000" strokeWidth="2.5" />
            <circle cx="160" cy="50" r="12" fill="#EC4899" stroke="#000" strokeWidth="2.5" />
            <path d="M 125,65 C 120,40 170,40 165,65" fill="#EC4899" stroke="#000" strokeWidth="3" />
            {/* Wanda Face */}
            <circle cx="148" cy="75" r="18" fill="#FEE2E2" stroke="#000" strokeWidth="3" />
            {/* Pink Hair curl on top */}
            <path d="M 132,70 Q 148,55 164,70 Q 148,62 132,70" fill="#EC4899" />
            {/* Big pink eyes */}
            <circle cx="142" cy="74" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
            <circle cx="142" cy="74" r="3" fill="#EC4899" />
            <circle cx="142" cy="74" r="1.2" fill="#000" />
            <circle cx="154" cy="74" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
            <circle cx="154" cy="74" r="3" fill="#EC4899" />
            <circle cx="154" cy="74" r="1.2" fill="#000" />
            {/* Red Lipstick Smile */}
            <path d="M 141,85 Q 148,91 154,84" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            {/* Yellow shirt and black pants */}
            <path d="M 138,93 L 158,93 L 155,115 L 141,115 Z" fill="#FDE047" stroke="#000" strokeWidth="2.5" />
            <rect x="142" y="115" width="12" height="15" fill="#111827" stroke="#000" strokeWidth="2" />
            {/* Wanda's Wings */}
            <ellipse cx="168" cy="98" rx="8" ry="4" fill="#93C5FD" stroke="#000" strokeWidth="1.5" opacity="0.8" />
            
            {/* --- WANDS (FLOATING OR INTERSECTING) --- */}
            {/* Cosmo's Wand */}
            <line x1="43" y1="120" x2="35" y2="140" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="35,138 32,148 40,148" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
            {/* Wanda's Wand */}
            <line x1="153" y1="120" x2="161" y2="140" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            <polygon points="161,138 164,148 156,148" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    case "billy": {
      const nose = getFill("#F472B6");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            {/* Stripe shirt */}
            <rect x="68" y="165" width="64" height="55" rx="8" fill="#FFFFFF" stroke="#000" strokeWidth="3.5" />
            {/* Blue horizontal stripe */}
            <rect x="68" y="180" width="64" height="14" fill="#3B82F6" />
            <line x1="68" y1="180" x2="132" y2="180" stroke="#000" strokeWidth="2" />
            <line x1="68" y1="194" x2="132" y2="194" stroke="#000" strokeWidth="2" />
            {/* Big round ears */}
            <circle cx="65" cy="115" r="16" fill="#FFC5A1" stroke="#000" strokeWidth="3.5" />
            <circle cx="135" cy="115" r="16" fill="#FFC5A1" stroke="#000" strokeWidth="3.5" />
            {/* Head Peach */}
            <circle cx="100" cy="115" r="42" fill="#FFC5A1" stroke="#000" strokeWidth="3.5" />
            {/* Eyes (derpy beads) */}
            <ellipse cx="88" cy="95" rx="7" ry="9" fill="#FFF" stroke="#000" strokeWidth="2.5" />
            <ellipse cx="110" cy="94" rx="5" ry="7" fill="#FFF" stroke="#000" strokeWidth="2.5" />
            <circle cx="89" cy="95" r="2.5" fill="#000" />
            <circle cx="110" cy="94" r="2" fill="#000" />
            {/* Giant Pink Nose! (Target) */}
            <circle cx="100" cy="118" r="22" fill={nose} stroke="#000" strokeWidth="4" />
            {/* Nose highlight */}
            <ellipse cx="94" cy="108" rx="5" ry="3" fill="#FFF" opacity="0.6" />
            {/* Massive wide happy mouth underneath nose */}
            <path d="M 72,135 Q 100,165 128,135" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
            {/* Teeth of billy */}
            <line x1="88" y1="147" x2="112" y2="147" stroke="#000" strokeWidth="1.5" />
            {/* Red backwards cap */}
            <path d="M 64,85 C 64,55 136,55 136,85 Z" fill="#DC2626" stroke="#000" strokeWidth="3.5" />
            <path d="M 64,83 C 75,80 125,80 136,83" stroke="#000" strokeWidth="2" />
            {/* Cap visor at back (pointing up) */}
            <path d="M 134,80 C 150,75 158,60 152,50 C 144,45 134,55 130,76 Z" fill="#DC2626" stroke="#000" strokeWidth="3" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    case "mandy": {
      const dress = getFill("#EA649E");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            {/* Body pink dress (Target) */}
            <path d="M 80,165 L 120,165 L 130,215 L 70,215 Z" fill={dress} stroke="#000" strokeWidth="3.5" />
            {/* Yellow flower on dress */}
            <circle cx="100" cy="185" r="6" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
            <circle cx="100" cy="175" r="4" fill="#38BDF8" stroke="#000" strokeWidth="1.2" />
            <circle cx="91" cy="185" r="4" fill="#38BDF8" stroke="#000" strokeWidth="1.2" />
            <circle cx="109" cy="185" r="4" fill="#38BDF8" stroke="#000" strokeWidth="1.2" />
            <circle cx="100" cy="195" r="4" fill="#38BDF8" stroke="#000" strokeWidth="1.2" />
            {/* Neck peach */}
            <rect x="92" y="145" width="16" height="22" fill="#FEE2E2" stroke="#000" strokeWidth="3" />
            {/* Angry head shape */}
            <circle cx="100" cy="110" r="42" fill="#FEE2E2" stroke="#000" strokeWidth="3.5" />
            {/* Black headband */}
            <path d="M 64,88 C 76,78 124,78 136,88" fill="none" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
            {/* Blonde Devil-Horn Bangs Hair */}
            <path d="M 58,110 C 50,75 75,55 100,75 C 125,55 150,75 142,110 C 145,100 135,80 100,88 C 65,80 55,100 58,110 Z" fill="#FDE047" stroke="#000" strokeWidth="3.5" />
            {/* Cold serious half-moon angry eyes */}
            <path d="M 72,110 C 72,98 90,98 90,110 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />
            <circle cx="81" cy="107" r="3" fill="#000" />
            <path d="M 110,110 C 110,98 128,98 128,110 Z" fill="#FFFFFF" stroke="#000" strokeWidth="2.5" />
            <circle cx="119" cy="107" r="3" fill="#000" />
            {/* Angled eyebrows */}
            <line x1="70" y1="96" x2="92" y2="103" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <line x1="130" y1="96" x2="108" y2="103" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            {/* Unamused straight line mouth */}
            <path d="M 90,135 Q 100,128 110,135" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    case "grim": {
      const hoodIn = getFill("#DC2626");
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[350px]">
            <circle cx="100" cy="120" r="85" fill="#1E293B" opacity="0.3" />
            {/* Black cloak robe body */}
            <path d="M 60,160 L 140,160 L 160,230 L 40,230 Z" fill="#1C1917" stroke="#000" strokeWidth="4" />
            {/* Outer black hood scoop */}
            <path d="M 52,110 C 42,40 158,40 148,110 C 145,150 55,150 52,110 Z" fill="#1C1917" stroke="#000" strokeWidth="3.5" />
            {/* Red Inner Hood backdrop (Target) */}
            <path d="M 64,110 C 58,60 142,60 136,110 C 130,138 70,138 64,110 Z" fill={hoodIn} stroke="#000" strokeWidth="3" />
            {/* White skull face */}
            <path d="M 76,105 C 76,82 124,82 124,105 C 124,124 76,124 76,105 Z" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
            {/* Skull chin */}
            <rect x="88" y="112" width="24" height="15" rx="4" fill="#FFFFFF" stroke="#000" strokeWidth="3" />
            <line x1="94" y1="120" x2="94" y2="127" stroke="#000" strokeWidth="2" />
            <line x1="100" y1="120" x2="100" y2="127" stroke="#000" strokeWidth="2" />
            <line x1="106" y1="120" x2="106" y2="127" stroke="#000" strokeWidth="2" />
            {/* Large cartoon empty eye sockets */}
            <ellipse cx="90" cy="100" rx="9" ry="11" fill="#111827" stroke="#000" strokeWidth="2" />
            <ellipse cx="110" cy="100" rx="9" ry="11" fill="#111827" stroke="#000" strokeWidth="2" />
            {/* Glowing red pupils */}
            <circle cx="90" cy="100" r="2.5" fill="#EF4444" />
            <circle cx="110" cy="100" r="2.5" fill="#EF4444" />
            {/* Nose cavity */}
            <polygon points="100,107 96,113 104,113" fill="#111827" />
            {/* Scythe handle and blade */}
            <line x1="150" y1="50" x2="175" y2="210" stroke="#78350F" strokeWidth="4.5" />
            <path d="M 152,50 C 140,40 100,50 82,75 C 92,68 135,62 152,50 Z" fill="#94A3B8" stroke="#000" strokeWidth="2.5" />
          </svg>
          {vectorBadge}
        </div>
      );
    }

    default:
      return (
        <div className="w-full h-full min-h-[250px] bg-slate-800 rounded-xl flex items-center justify-center border border-dashed border-slate-600">
          <span className="text-slate-400 font-mono">No Toon SVG</span>
        </div>
      );
  }
};
