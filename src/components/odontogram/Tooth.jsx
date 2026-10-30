import React from 'react';

// Complete Condition Color mapping matching Backend Swagger ENUMs
export const CONDITION_COLORS = {
  sound: { 
    bg: '#10b981', 
    border: '#059669', 
    text: '#065f46', 
    label: 'Clear skin', 
    fill: '#ffffff',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  healthy: { 
    bg: '#10b981', 
    border: '#059669', 
    text: '#065f46', 
    label: 'Clear skin', 
    fill: '#ffffff',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  caries: { 
    bg: '#ef4444', 
    border: '#dc2626', 
    text: '#991b1b', 
    label: 'Acne / Breakouts', 
    fill: '#ef4444',
    surfaceFill: '#f87171',
    glow: 'rgba(239, 68, 68, 0.25)'
  },
  cavity: { 
    bg: '#ef4444', 
    border: '#dc2626', 
    text: '#991b1b', 
    label: 'Acne / Breakouts', 
    fill: '#ef4444',
    surfaceFill: '#f87171',
    glow: 'rgba(239, 68, 68, 0.25)'
  },
  filled: { 
    bg: '#3b82f6', 
    border: '#2563eb', 
    text: '#1e40af', 
    label: 'Hydration / Barrier Care', 
    fill: '#3b82f6',
    surfaceFill: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.25)'
  },
  filling: { 
    bg: '#3b82f6', 
    border: '#2563eb', 
    text: '#1e40af', 
    label: 'Hydration / Barrier Care', 
    fill: '#3b82f6',
    surfaceFill: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.25)'
  },
  crown: { 
    bg: '#f59e0b', 
    border: '#d97706', 
    text: '#92400e', 
    label: 'Chemical Peel', 
    fill: '#fbbf24',
    surfaceFill: '#fde68a',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  root_canal: { 
    bg: '#f97316', 
    border: '#ea580c', 
    text: '#9a3412', 
    label: 'Laser Therapy', 
    fill: '#f97316',
    surfaceFill: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.25)'
  },
  rct: { 
    bg: '#f97316', 
    border: '#ea580c', 
    text: '#9a3412', 
    label: 'Laser Therapy', 
    fill: '#f97316',
    surfaceFill: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.25)'
  },
  extracted: { 
    bg: '#64748b', 
    border: '#475569', 
    text: '#334155', 
    label: 'Irritation Review', 
    fill: '#94a3b8',
    surfaceFill: '#cbd5e1',
    glow: 'rgba(100, 116, 139, 0.2)'
  },
  missing: { 
    bg: '#64748b', 
    border: '#475569', 
    text: '#334155', 
    label: 'Irritation Review', 
    fill: '#94a3b8',
    surfaceFill: '#cbd5e1',
    glow: 'rgba(100, 116, 139, 0.2)'
  },
  implant: { 
    bg: '#8b5cf6', 
    border: '#7c3aed', 
    text: '#5b21b6', 
    label: 'Scar Revision', 
    fill: '#8b5cf6',
    surfaceFill: '#c4b5fd',
    glow: 'rgba(139, 92, 246, 0.25)'
  },
  fracture: { 
    bg: '#ec4899', 
    border: '#db2777', 
    text: '#9d174d', 
    label: 'Fine-line Treatment', 
    fill: '#ec4899',
    surfaceFill: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.25)'
  },
  veneer: { 
    bg: '#06b6d4', 
    border: '#0891b2', 
    text: '#155e75', 
    label: 'Pigmentation Care', 
    fill: '#06b6d4',
    surfaceFill: '#67e8f9',
    glow: 'rgba(6, 182, 212, 0.25)'
  },
  impacted: { 
    bg: '#6366f1', 
    border: '#4f46e5', 
    text: '#3730a3', 
    label: 'Lesion Review', 
    fill: '#6366f1',
    surfaceFill: '#a5b4fc',
    glow: 'rgba(99, 102, 241, 0.25)'
  },
};

export const Tooth = ({
  number,
  fdiNumber,
  name,
  data = {},
  isSelected = false,
  notation = 'universal',
  isUpper = true,
  onSelect,
  onSurfaceClick,
}) => {
  const rawStatus = data?.condition || data?.status || 'sound';
  const status = (rawStatus === 'healthy' || rawStatus === 'sound') ? 'sound' : rawStatus;
  
  const surfaces = Array.isArray(data?.surfaces) 
    ? data.surfaces.map((s) => (typeof s === 'string' ? s : s?.surface || '')).filter(Boolean)
    : [];

  const conditionMeta = CONDITION_COLORS[status] || CONDITION_COLORS.sound;
  const displayNum = notation === 'fdi' ? (fdiNumber || number) : number;
  const subNum = notation === 'fdi' ? `#${number}` : (fdiNumber ? `FDI:${fdiNumber}` : '');

  const isExtractedOrMissing = status === 'extracted' || status === 'missing' || !!data?.isMissing;
  const hasRCT = status === 'root_canal' || status === 'rct' || !!data?.hasRootCanal;
  const hasCrown = status === 'crown' || !!data?.hasCrown;
  const hasImplant = status === 'implant' || !!data?.hasImplant;
  const hasVeneer = status === 'veneer';

  // Determine surface fill colors
  const getSurfaceFill = (surfaceName) => {
    if (isExtractedOrMissing) return '#f1f5f9';
    if (hasCrown) return '#fef08a';
    if (hasImplant) return '#ede9fe';
    if (hasRCT) return '#ffedd5';
    if (hasVeneer) return '#cffafe';
    
    const isSurfaceAffected = surfaces.includes(surfaceName);
    if (isSurfaceAffected) {
      return (status === 'caries' || status === 'cavity') ? '#ef4444' : '#3b82f6';
    }
    
    if (surfaces.length === 0 && (status === 'caries' || status === 'cavity' || status === 'filled' || status === 'filling')) {
      return (status === 'caries' || status === 'cavity') ? '#fca5a5' : '#93c5fd';
    }

    return '#ffffff';
  };

  const handleSurface = (surfaceName, e) => {
    e.stopPropagation();
    if (onSurfaceClick) {
      onSurfaceClick(fdiNumber || number, surfaceName, number);
    } else if (onSelect) {
      onSelect(fdiNumber || number, number);
    }
  };

  // Anatomical classification for root visualization
  const isMolar = [1,2,3, 14,15,16, 17,18,19, 30,31,32, 18,17,16, 26,27,28, 38,37,36, 46,47,48].includes(Number(fdiNumber) || Number(number));
  const isPremolar = [4,5, 12,13, 20,21, 28,29, 15,14, 24,25, 35,34, 44,45].includes(Number(fdiNumber) || Number(number));

  return (
    <div
      onClick={() => onSelect && onSelect(fdiNumber || number, number)}
      title={`${name || `Tooth #${number} (FDI: ${fdiNumber})`} - ${conditionMeta?.label || status}${data?.procedure ? ` (${data.procedure})` : ''}`}
      className={`group relative flex flex-col items-center p-1.5 sm:p-2 rounded-2xl cursor-pointer transition-all duration-300 select-none min-w-[56px] sm:min-w-[52px] ${
        isSelected
          ? 'bg-blue-50/90 border-2 border-blue-600 shadow-lg shadow-blue-500/15 scale-105 z-20 ring-4 ring-blue-500/10'
          : 'bg-white/80 hover:bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Upper Arch Numbering Header */}
      {isUpper && (
        <div className="flex flex-col items-center mb-1.5">
          <span className="text-xs sm:text-xs font-black text-slate-900 leading-none group-hover:text-blue-700 transition-colors">
            {displayNum}
          </span>
          <span className="text-[10px] sm:text-[9px] font-bold text-slate-400 leading-tight tracking-tight mt-0.5">
            {subNum}
          </span>
        </div>
      )}

      {/* SVG Graphical Anatomical Tooth (Roots + 5 Surface Segments) */}
      <div className="relative w-14 h-20 sm:w-12 sm:h-16 md:w-14 md:h-20 flex items-center justify-center">
        <svg
          viewBox="0 0 64 84"
          className={`w-full h-full filter transition-all duration-300 ${
            isExtractedOrMissing ? 'opacity-35 grayscale' : ''
          }`}
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            <linearGradient id={`tooth-enamel-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            <linearGradient id="rct-glow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>

            <linearGradient id="implant-metal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>

            <linearGradient id="crown-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* UPPER ROOTS (Bifurcated for molars, single for incisors/canines) */}
          {isUpper && (
            <g className="transition-colors">
              {isMolar ? (
                // Dual Root for Molars
                <>
                  <path
                    d="M 18 32 C 15 18, 18 6, 24 4 C 28 6, 27 18, 26 32 Z"
                    fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#e2e8f0"}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 38 32 C 37 18, 36 6, 40 4 C 46 6, 49 18, 46 32 Z"
                    fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#cbd5e1"}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                </>
              ) : (
                // Single Tapered Root
                <path
                  d="M 24 32 C 22 16, 28 4, 32 3 C 36 4, 42 16, 40 32 Z"
                  fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#e2e8f0"}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
              )}
            </g>
          )}

          {/* CROWN ENAMEL CAPSULE WITH 5 SURFACES */}
          <g transform={isUpper ? "translate(7, 30)" : "translate(7, 4)"}>
            {/* Outer Enamel Base with drop shadow effect */}
            <rect 
              x="1" 
              y="1" 
              width="48" 
              height="46" 
              rx="10" 
              fill={hasCrown ? "url(#crown-gold)" : `url(#tooth-enamel-${number})`} 
              stroke={isSelected ? "#2563eb" : "#64748b"} 
              strokeWidth={isSelected ? "2" : "1.5"} 
            />

            {/* TOP / BUCCAL (FACIAL) SURFACE */}
            <path
              d="M 3 3 L 47 3 C 44 11, 40 14, 37 14 L 13 14 C 10 14, 6 11, 3 3 Z"
              fill={getSurfaceFill('buccal')}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:brightness-95 transition-all cursor-pointer"
              onClick={(e) => handleSurface('buccal', e)}
            />

            {/* BOTTOM / LINGUAL (PALATAL) SURFACE */}
            <path
              d="M 13 34 L 37 34 C 40 34, 44 37, 47 45 L 3 45 C 6 37, 10 34, 13 34 Z"
              fill={getSurfaceFill('lingual')}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:brightness-95 transition-all cursor-pointer"
              onClick={(e) => handleSurface('lingual', e)}
            />

            {/* LEFT / MESIAL SURFACE */}
            <path
              d="M 3 3 L 13 14 L 13 34 L 3 45 Z"
              fill={getSurfaceFill('mesial')}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:brightness-95 transition-all cursor-pointer"
              onClick={(e) => handleSurface('mesial', e)}
            />

            {/* RIGHT / DISTAL SURFACE */}
            <path
              d="M 47 3 L 37 14 L 37 34 L 47 45 Z"
              fill={getSurfaceFill('distal')}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:brightness-95 transition-all cursor-pointer"
              onClick={(e) => handleSurface('distal', e)}
            />

            {/* CENTER / OCCLUSAL-INCISAL SURFACE */}
            <rect
              x="13"
              y="14"
              width="24"
              height="20"
              rx="4"
              fill={getSurfaceFill('occlusal')}
              stroke="#64748b"
              strokeWidth="1"
              className="hover:brightness-95 transition-all cursor-pointer"
              onClick={(e) => handleSurface('occlusal', e)}
            />
          </g>

          {/* LOWER ROOTS */}
          {!isUpper && (
            <g className="transition-colors">
              {isMolar ? (
                <>
                  <path
                    d="M 18 50 C 15 64, 18 78, 24 80 C 28 78, 27 64, 26 50 Z"
                    fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#e2e8f0"}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 38 50 C 37 64, 36 78, 40 80 C 46 78, 49 64, 46 50 Z"
                    fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#cbd5e1"}
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                </>
              ) : (
                <path
                  d="M 24 50 C 22 66, 28 79, 32 80 C 36 79, 42 66, 40 50 Z"
                  fill={hasRCT ? "url(#rct-glow)" : hasImplant ? "url(#implant-metal)" : "#e2e8f0"}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />
              )}
            </g>
          )}

          {/* EXTRACTED CROSS MARKER */}
          {isExtractedOrMissing && (
            <g stroke="#dc2626" strokeWidth="4" strokeLinecap="round">
              <line x1="12" y1="12" x2="52" y2="72" />
              <line x1="52" y1="12" x2="12" y2="72" />
            </g>
          )}

          {/* IMPLANT TITANIUM POST INDICATOR */}
          {hasImplant && (
            <g fill="#7c3aed" stroke="#ffffff" strokeWidth="1">
              <circle cx="32" cy={isUpper ? 16 : 68} r="5" />
              <line x1="26" y1={isUpper ? 20 : 64} x2="38" y2={isUpper ? 20 : 64} stroke="#7c3aed" strokeWidth="2.5" />
              <line x1="28" y1={isUpper ? 24 : 60} x2="36" y2={isUpper ? 24 : 60} stroke="#7c3aed" strokeWidth="2.5" />
            </g>
          )}
        </svg>
      </div>

      {/* Lower Arch Numbering Footer */}
      {!isUpper && (
        <div className="flex flex-col items-center mt-1.5">
          <span className="text-[10px] sm:text-[9px] font-bold text-slate-400 leading-tight tracking-tight mb-0.5">
            {subNum}
          </span>
          <span className="text-xs sm:text-xs font-black text-slate-900 leading-none group-hover:text-blue-700 transition-colors">
            {displayNum}
          </span>
        </div>
      )}

      {/* Modern Status Badge / Pill */}
      {status !== 'sound' && status !== 'healthy' ? (
        <div className="mt-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
          <span
            className="w-2 h-2 rounded-full shadow-2xs"
            style={{ backgroundColor: conditionMeta?.bg || '#ef4444' }}
          />
          <span 
            className="text-[10px] sm:text-[9px] font-black uppercase tracking-tight truncate max-w-[48px]"
            style={{ color: conditionMeta?.text || '#1e293b' }}
          >
            {(conditionMeta?.label || status || '').split('(')[0].split('/')[0].trim()}
          </span>
        </div>
      ) : (
        <div className="mt-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-bold text-slate-400">Click</span>
        </div>
      )}
    </div>
  );
};
