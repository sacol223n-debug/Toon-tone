import React, { useState, useEffect, useRef } from "react";

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

// Convert HSV to HEX Code
const hsvToHex = (h: number, s: number, v: number): string => {
  s /= 100;
  v /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => v * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  
  const r = Math.round(255 * f(5));
  const g = Math.round(255 * f(3));
  const b = Math.round(255 * f(1));
  
  const toHex = (x: number) => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// Convert HEX to HSV
const hexToHsv = (hex: string) => {
  let hStr = hex.replace("#", "");
  if (hStr.length === 3) {
    hStr = hStr.split("").map((x) => x + x).join("");
  }
  const r = parseInt(hStr.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(hStr.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(hStr.slice(4, 6), 16) / 255 || 0;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  
  if (max !== min) {
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s),
    v: Math.round(v),
  };
};

const hexToRgb = (hex: string) => {
  let s = hex.replace("#", "");
  if (s.length === 3) {
    s = s.split("").map((x) => x + x).join("");
  }
  const r = parseInt(s.slice(0, 2), 16) || 0;
  const g = parseInt(s.slice(2, 4), 16) || 0;
  const b = parseInt(s.slice(4, 6), 16) || 0;
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  const toHex = (x: number) => {
    const h = clamp(x).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [pickerMode, setPickerMode] = useState<"pad" | "rgb">("pad");
  const [hsv, setHsv] = useState({ h: 180, s: 50, v: 50 });
  const padRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Sync state if external color changes, but avoid loops
  useEffect(() => {
    const parsed = hexToHsv(color);
    // If the difference is meaningful, update
    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
    if (currentHex !== color.toUpperCase()) {
      setHsv(parsed);
    }
  }, [color]);

  const updateColor = (h: number, s: number, v: number) => {
    setHsv({ h, s, v });
    onChange(hsvToHex(h, s, v));
  };

  const handlePadInteraction = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    
    // Calculate S (0-100) and V (100 - 0)
    let s = ((clientX - rect.left) / rect.width) * 100;
    let v = (1 - (clientY - rect.top) / rect.height) * 100;
    
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));
    
    updateColor(hsv.h, Math.round(s), Math.round(v));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handlePadInteraction(e.clientX, e.clientY);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handlePadInteraction(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // Touch handlers for mobile devices
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches[0]) {
      handlePadInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.cancelable) e.preventDefault(); // prevent scrolling while selecting color
    if (!isDragging.current || !e.touches[0]) return;
    handlePadInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
  };

  // Hue conversion gradient
  const currentHueBaseHex = hsvToHex(hsv.h, 100, 100);

  const rgb = hexToRgb(color);

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const nextRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, val)) };
    onChange(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const adjustChannelWithButton = (channel: "r" | "g" | "b", amount: number) => {
    const nextVal = Math.max(0, Math.min(255, rgb[channel] + amount));
    handleRgbChange(channel, nextVal);
  };

  return (
    <div id="custom-color-picker" className="flex flex-col items-center gap-4.5 w-full max-w-[320px]">
      
      {/* Visual Toggler Selector */}
      <div className="flex bg-[#EBF3FA] p-1 rounded-xl border-2 border-zinc-950 w-full shadow-[2px_2px_0_0_#000] text-[10px] uppercase font-black tracking-widest leading-none select-none">
        <button
          type="button"
          onClick={() => setPickerMode("pad")}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
            pickerMode === "pad"
              ? "bg-[#00B894] text-white border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000]"
              : "text-zinc-500 hover:text-zinc-950"
          }`}
        >
          🎛️ Panel Táctil
        </button>
        <button
          type="button"
          onClick={() => setPickerMode("rgb")}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
            pickerMode === "rgb"
              ? "bg-[#6C5CE7] text-white border-2 border-zinc-950 shadow-[1.5px_1.5px_0_0_#000]"
              : "text-zinc-500 hover:text-zinc-950"
          }`}
        >
          🔬 Calibración RGB
        </button>
      </div>

      {pickerMode === "pad" ? (
        <>
          {/* Saturation/Value 2D Selector Pad */}
          <div
            ref={padRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="relative w-full aspect-square rounded-[24px] cursor-crosshair overflow-hidden touch-none select-none border-[3px] border-zinc-950 shadow-[4px_4px_0_0_#000]"
            style={{ backgroundColor: currentHueBaseHex }}
          >
            {/* White source light gradient (left-to-right) */}
            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
            {/* Black shade gradient (bottom-to-top) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />

            {/* Picker dot selector */}
            <div
              className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-zinc-950 shadow-md pointer-events-none transition-[transform] duration-75 active:scale-125"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: color,
                boxShadow: "0 0 0 2px rgba(255,255,255,0.8), inset 0 0 4px rgba(0,0,0,0.4)",
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1 text-[11px] text-zinc-700 font-extrabold uppercase tracking-tight">
              <span>Matiz (Hue)</span>
              <span className="font-mono bg-[#FFEAA7] px-2 py-0.5 border-2 border-zinc-950 rounded-md text-[10px] text-zinc-950 font-black shadow-[1px_1px_0_0_#000]">{hsv.h}°</span>
            </div>
            <div className="relative w-full h-[22px] rounded-full overflow-hidden border-[3px] border-zinc-950 shadow-[2px_2px_0_0_#000] cursor-pointer select-none">
              <input
                id="hue-slider-input"
                type="range"
                min="0"
                max="360"
                value={hsv.h}
                onChange={(e) => updateColor(parseInt(e.target.value), hsv.s, hsv.v)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                }}
              />
              {/* Custom handle reflecting over the slider background */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full border-[2.5px] border-zinc-950 pointer-events-none shadow"
                style={{
                  left: `calc(${(hsv.h / 360) * 100}% - 11px)`,
                  backgroundColor: currentHueBaseHex,
                }}
              />
            </div>
          </div>
        </>
      ) : (
        /* RGB Mode Precision Sliders Calibration Panel */
        <div className="w-full flex flex-col gap-3.5 bg-[#FFFBEA] p-4.5 rounded-[24px] border-[3px] border-zinc-950 shadow-[4px_4px_0_0_#000]">
          
          {/* Channel Red */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] font-black text-red-650 tracking-wide uppercase">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FF7675] border border-zinc-950" /> Rojo (Red)</span>
              <span className="font-mono text-zinc-950 bg-white border-2 border-zinc-950 px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">{rgb.r}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("r", -10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -10
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("r", -1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -1
              </button>
              
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange("r", parseInt(e.target.value))}
                className="flex-1 accent-[#FF7675] cursor-pointer h-2 border-2 border-zinc-950 rounded-full bg-white shadow-inner"
              />
              
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("r", 1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +1
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("r", 10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>

          {/* Channel Green */}
          <div className="flex flex-col gap-1.5 mt-0.5">
            <div className="flex justify-between items-center text-[10px] font-black text-emerald-650 tracking-wide uppercase">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#00B894] border border-zinc-950" /> Verde (Green)</span>
              <span className="font-mono text-zinc-950 bg-white border-2 border-zinc-950 px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">{rgb.g}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("g", -10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -10
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("g", -1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -1
              </button>
              
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange("g", parseInt(e.target.value))}
                className="flex-1 accent-[#00B894] cursor-pointer h-2 border-2 border-zinc-950 rounded-full bg-white shadow-inner"
              />
              
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("g", 1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +1
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("g", 10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>

          {/* Channel Blue */}
          <div className="flex flex-col gap-1.5 mt-0.5">
            <div className="flex justify-between items-center text-[10px] font-black text-indigo-650 tracking-wide uppercase">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#54A0FF] border border-zinc-950" /> Azul (Blue)</span>
              <span className="font-mono text-zinc-950 bg-white border-2 border-zinc-950 px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">{rgb.b}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("b", -10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -10
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("b", -1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                -1
              </button>
              
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange("b", parseInt(e.target.value))}
                className="flex-1 accent-[#54A0FF] cursor-pointer h-2 border-2 border-zinc-950 rounded-full bg-white shadow-inner"
              />
              
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("b", 1)}
                className="w-7 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +1
              </button>
              <button 
                type="button" 
                onClick={() => adjustChannelWithButton("b", 10)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 border-2 border-zinc-950 text-[10px] font-black shadow-[1px_1px_0_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sub-controls: swatches and typed code */}
      <div className="w-full flex items-center justify-between gap-3 bg-white p-3.5 rounded-[22px] border-[3px] border-zinc-950 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl border-2 border-zinc-950 shadow-[1px_1px_0_0_#000] transition-all duration-300"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold font-mono">Hexadecimal</span>
            <input
              id="hex-string-input"
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                  onChange(val);
                }
              }}
              placeholder="#FFFFFF"
              maxLength={7}
              className="bg-transparent text-sm font-mono font-black text-zinc-950 outline-none w-20 tracking-wider focus:text-[#6C5CE7]"
            />
          </div>
        </div>

        {/* Quick helper palettes (Swatches typical of classic cartoony tones) */}
        <div className="flex gap-1.5">
          {["#E11D48", "#FED41D", "#3FA34D", "#9333EA", "#38BDF8"].map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => onChange(tone)}
              style={{ backgroundColor: tone }}
              title={tone}
              className="w-5.5 h-5.5 rounded-lg border-2 border-zinc-950 opacity-90 hover:opacity-100 hover:scale-115 active:scale-90 transition-all cursor-pointer shadow-[1px_1px_0_0_#000]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
