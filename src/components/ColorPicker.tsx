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

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
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

  return (
    <div id="custom-color-picker" className="flex flex-col items-center gap-5 w-full max-w-[320px]">
      {/* Saturation/Value 2D Selector Pad */}
      <div
        ref={padRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="relative w-full aspect-square rounded-2xl cursor-crosshair overflow-hidden touch-none select-none border-2 border-slate-700/50 shadow-inner"
        style={{ backgroundColor: currentHueBaseHex }}
      >
        {/* White source light gradient (left-to-right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        {/* Black shade gradient (bottom-to-top) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95" />

        {/* Picker dot selector */}
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg pointer-events-none transition-[transform] duration-75 active:scale-125"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: color,
            boxShadow: "0 0 0 2px rgba(0,0,0,0.5), inset 0 0 4px rgba(0,0,0,0.15)",
          }}
        />
      </div>

      {/* Hue Slider */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between items-center px-1 text-xs text-slate-400 font-mono">
          <span>Matiz (Hue)</span>
          <span>{hsv.h}°</span>
        </div>
        <div className="relative w-full h-[18px] rounded-full overflow-hidden border border-slate-700 cursor-pointer select-none">
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
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none shadow"
            style={{
              left: `calc(${(hsv.h / 360) * 100}% - 8px)`,
              backgroundColor: currentHueBaseHex,
            }}
          />
        </div>
      </div>

      {/* Sub-controls: swatches and typed code */}
      <div className="w-full flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border border-slate-700 shadow-sm transition-all duration-300"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Hexadecimal</span>
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
              className="bg-transparent text-sm font-mono font-semibold text-slate-200 outline-none w-20 tracking-wider focus:text-indigo-400"
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
              className="w-5 h-5 rounded-md border border-slate-950/40 opacity-70 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
