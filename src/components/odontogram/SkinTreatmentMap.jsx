import React, { useState } from 'react';
import { CONDITION_COLORS } from './Tooth';

export const SKIN_REGIONS = {
  1: { label: 'Forehead', group: 'Face', x: 50, y: 28 },
  2: { label: 'Left temple', group: 'Face', x: 25, y: 39 },
  3: { label: 'Right temple', group: 'Face', x: 75, y: 39 },
  4: { label: 'Left cheek', group: 'Face', x: 27, y: 54 },
  5: { label: 'Right cheek', group: 'Face', x: 73, y: 54 },
  6: { label: 'Nose', group: 'Face', x: 50, y: 47 },
  7: { label: 'Chin', group: 'Face', x: 50, y: 72 },
  8: { label: 'Jawline', group: 'Face', x: 78, y: 66 },
  9: { label: 'Neck', group: 'Body', side: 'both', x: 50, y: 16 },
  10: { label: 'Chest', group: 'Body', side: 'front', x: 50, y: 31 },
  11: { label: 'Upper back', group: 'Body', side: 'back', x: 50, y: 31 },
  12: { label: 'Left arm', group: 'Body', side: 'both', x: 27, y: 34 },
  13: { label: 'Right arm', group: 'Body', side: 'both', x: 73, y: 34 },
  14: { label: 'Abdomen', group: 'Body', side: 'front', x: 50, y: 47 },
  15: { label: 'Left leg', group: 'Body', side: 'both', x: 42, y: 72 },
  16: { label: 'Right leg', group: 'Body', side: 'both', x: 58, y: 72 },
  17: { label: 'Hands', group: 'Body', side: 'both', x: 18, y: 54 },
  18: { label: 'Feet', group: 'Body', side: 'both', x: 50, y: 91 },
};

const CONDITION_DOTS = {
  caries: '#ef4444',
  cavity: '#ef4444',
  filled: '#3b82f6',
  filling: '#3b82f6',
  crown: '#f59e0b',
  root_canal: '#f97316',
  rct: '#f97316',
  extracted: '#64748b',
  missing: '#64748b',
  implant: '#8b5cf6',
  fracture: '#ec4899',
  veneer: '#06b6d4',
  impacted: '#6366f1',
};

const SkinTreatmentMap = ({ teethData = {}, selectedTooth = null, onSelectTooth }) => {
  const [activeView, setActiveView] = useState('Face');
  const [bodySide, setBodySide] = useState('front');
  const visibleRegions = Object.entries(SKIN_REGIONS).filter(([, region]) =>
    region.group === activeView && (activeView === 'Face' || region.side === 'both' || region.side === bodySide)
  );

  const getRegionStatus = (id) => {
    const data = teethData[id] || teethData[String(id)] || {};
    return data.condition || data.status || 'sound';
  };

  const getRegionName = (id) => SKIN_REGIONS[id]?.label || `Area ${id}`;

  return (
    <section className="w-full rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-orange-50/50 p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">Skin treatment map</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Select a body area to record or review a skin concern.</p>
        </div>
        <div className="flex rounded-xl border border-rose-100 bg-white p-1 shadow-sm">
          {['Face', 'Body'].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                activeView === view ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
      {activeView === 'Body' && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-100/80 bg-white/80 p-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">Body view</p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">Switch sides to assess each area clearly.</p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {['front', 'back'].map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setBodySide(side)}
                aria-pressed={bodySide === side}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition-all ${
                  bodySide === side ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.95fr)_1fr]">
        <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-white p-4 sm:p-6">
          <div className={`relative w-full ${activeView === 'Face' ? 'max-w-[280px] aspect-[2/3]' : 'max-w-[240px] aspect-[10/17]'}`}>
            {activeView === 'Face' ? (
              <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full drop-shadow-[0_14px_16px_rgba(115,66,54,0.12)]" aria-label="Facial skin treatment map">
                <defs>
                  <linearGradient id="faceSkin" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#fff8f1" />
                    <stop offset=".52" stopColor="#f8d9ca" />
                    <stop offset="1" stopColor="#edbba9" />
                  </linearGradient>
                  <radialGradient id="faceHighlight" cx=".5" cy=".35" r=".58">
                    <stop offset="0" stopColor="#fffaf4" stopOpacity=".95" />
                    <stop offset="1" stopColor="#f5cabb" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="faceEar" x1="0" x2="1">
                    <stop stopColor="#efb9a7" />
                    <stop offset="1" stopColor="#f9d9cc" />
                  </linearGradient>
                </defs>
                <path d="M43 93c-17-10-25 2-22 25 2 17 10 28 24 28M157 93c17-10 25 2 22 25-2 17-10 28-24 28" fill="url(#faceEar)" stroke="#dba795" strokeWidth="2.5" />
                <path d="M100 15c-42 0-68 30-68 77 0 72 26 128 68 157 42-29 68-85 68-157 0-47-26-77-68-77Z" fill="url(#faceSkin)" stroke="#dba795" strokeWidth="3" />
                <path d="M100 21c-37 0-59 27-59 70 0 65 23 116 59 141 36-25 59-76 59-141 0-43-22-70-59-70Z" fill="url(#faceHighlight)" />
                <path d="M47 99c12-12 30-15 45-5M108 94c15-10 33-7 45 5" fill="none" stroke="#a76d61" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M50 111c11-8 24-8 36 0M114 111c11-8 24-8 36 0" fill="none" stroke="#76544f" strokeWidth="2.2" strokeLinecap="round" />
                <ellipse cx="70" cy="111" rx="3.5" ry="4.3" fill="#493b39" />
                <ellipse cx="130" cy="111" rx="3.5" ry="4.3" fill="#493b39" />
                <circle cx="71" cy="109.5" r="1.2" fill="white" />
                <circle cx="131" cy="109.5" r="1.2" fill="white" />
                <path d="M100 115c-3 15-9 30-8 37 2 5 8 7 15 4" fill="none" stroke="#bd8173" strokeWidth="2.6" strokeLinecap="round" />
                <ellipse cx="91" cy="150" rx="3" ry="2" fill="#dfaa9a" />
                <ellipse cx="109" cy="150" rx="3" ry="2" fill="#dfaa9a" />
                <path d="M76 183c13-8 35-8 48 0-5 10-15 15-24 15s-19-5-24-15Z" fill="#c87973" />
                <path d="M82 184c11 3 25 3 36 0M82 185c7 8 12 11 18 11s11-3 18-11" fill="none" stroke="#a95e5c" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M47 147c9 12 18 17 30 18M153 147c-9 12-18 17-30 18" fill="none" stroke="#efb9aa" strokeWidth="2" opacity=".8" />
                <path d="M70 154c7 5 14 7 21 7M130 154c-7 5-14 7-21 7" fill="none" stroke="#e9a89f" strokeWidth="5" strokeLinecap="round" opacity=".48" />
              </svg>
            ) : (
              <svg viewBox="0 0 200 340" className="absolute inset-0 h-full w-full drop-shadow-[0_14px_16px_rgba(115,66,54,0.12)]" aria-label="Body skin treatment map">
                <defs>
                  <linearGradient id="bodySkin" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#fff8f1" />
                    <stop offset=".5" stopColor="#f7d8c9" />
                    <stop offset="1" stopColor="#edb9a7" />
                  </linearGradient>
                  <linearGradient id="bodyShade" x1="0" x2="1">
                    <stop stopColor="#e9b5a4" />
                    <stop offset=".5" stopColor="#fff1e8" />
                    <stop offset="1" stopColor="#e9b5a4" />
                  </linearGradient>
                </defs>
                <path d="M81 12c0 17 6 27 19 27s19-10 19-27" fill="url(#bodySkin)" stroke="#dba795" strokeWidth="2.5" />
                <path d="M80 34c-16 4-27 12-37 24L20 115c-5 12-1 21 9 24 9 3 16-2 20-11l17-38v87l-14 111c-2 14 4 22 14 23 10 1 16-6 18-17l16-83 16 83c2 11 8 18 18 17 10-1 16-9 14-23l-14-111V90l17 38c4 9 11 14 20 11 10-3 14-12 9-24l-23-57c-10-12-21-20-37-24-10 7-20 10-30 10S90 41 80 34Z" fill="url(#bodySkin)" stroke="#dba795" strokeWidth="3" strokeLinejoin="round" />
                {bodySide === 'front' ? (
                  <>
                    <path d="M78 42c7 9 14 13 22 13s15-4 22-13M100 55v122M72 91c9 7 18 10 28 10s19-3 28-10M75 143c8 5 16 8 25 8s17-3 25-8" fill="none" stroke="#cf9382" strokeWidth="2.5" strokeLinecap="round" opacity=".72" />
                    <path d="M81 57c-9 17-12 35-11 53M119 57c9 17 12 35 11 53M80 184l-12 101M120 184l12 101M44 62 25 116M156 62l19 54" fill="none" stroke="url(#bodyShade)" strokeWidth="5" strokeLinecap="round" opacity=".68" />
                    <ellipse cx="100" cy="142" rx="3" ry="4" fill="#c88776" opacity=".7" />
                    <path d="M77 186c15 8 31 8 46 0" fill="none" stroke="#dba795" strokeWidth="2" strokeLinecap="round" opacity=".7" />
                  </>
                ) : (
                  <>
                    <path d="M100 54v221M75 72c8 17 16 25 25 25s17-8 25-25M72 99c9 10 18 15 28 15s19-5 28-15M79 183l-11 102M121 183l11 102M44 62 25 116M156 62l19 54" fill="none" stroke="#cf9382" strokeWidth="2.5" strokeLinecap="round" opacity=".68" />
                    <path d="M72 83c10-9 19-12 28-7M128 83c-10-9-19-12-28-7M78 150c6 4 13 6 22 6M122 150c-6 4-13 6-22 6" fill="none" stroke="#e9b5a4" strokeWidth="5" strokeLinecap="round" opacity=".66" />
                  </>
                )}
              </svg>
            )}

            {visibleRegions.map(([id, region]) => {
              const status = getRegionStatus(id);
              const color = CONDITION_DOTS[status] || (status === 'sound' || status === 'healthy' ? '#10b981' : CONDITION_COLORS[status]?.bg || '#10b981');
              const isSelected = String(selectedTooth) === id;
              return (
                <button
                  key={id}
                  type="button"
                  title={`${region.label}${status !== 'sound' && status !== 'healthy' ? ` · ${CONDITION_COLORS[status]?.label || status}` : ''}`}
                  aria-label={`Select ${region.label}`}
                  onClick={() => onSelectTooth?.(Number(id), Number(id))}
                  className={`absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] text-[11px] font-black text-white shadow-[0_3px_8px_rgba(15,23,42,0.28)] transition-transform hover:scale-125 ${
                    isSelected ? 'scale-125 ring-4 ring-rose-200' : 'hover:ring-2 hover:ring-white/90'
                  }`}
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    backgroundColor: color,
                    borderColor: isSelected ? '#be123c' : '#fff',
                  }}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid content-start grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleRegions.map(([id]) => {
            const status = getRegionStatus(id);
            const isSelected = String(selectedTooth) === id;
            const condition = CONDITION_COLORS[status];
            const isMarked = status !== 'sound' && status !== 'healthy';
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTooth?.(Number(id), Number(id))}
                className={`flex min-h-[62px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${
                  isSelected ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/50'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-sm" style={{ backgroundColor: isMarked ? CONDITION_DOTS[status] || condition?.bg || '#10b981' : '#94a3b8' }}>
                  {id}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold text-slate-800">{getRegionName(id)}</span>
                  <span className="block truncate text-[10px] font-medium text-slate-400">{isMarked ? condition?.label || status : 'No treatment planned'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-[10px] font-medium text-slate-400">Numbered markers identify treatment locations. Click a marker or area name to record a finding.</p>
    </section>
  );
};

export default SkinTreatmentMap;
