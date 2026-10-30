import React, { useState } from 'react';
import { Tooth } from './Tooth';

// Adult 32 Teeth Definitions (Universal & FDI with Anatomical Names)
export const ADULT_TEETH = {
  upper: [
    // Quadrant 1 (Upper Right)
    { number: 1, fdi: 18, name: "Upper Right 3rd Molar (Wisdom)", quadrant: "Q1" },
    { number: 2, fdi: 17, name: "Upper Right 2nd Molar", quadrant: "Q1" },
    { number: 3, fdi: 16, name: "Upper Right 1st Molar", quadrant: "Q1" },
    { number: 4, fdi: 15, name: "Upper Right 2nd Premolar", quadrant: "Q1" },
    { number: 5, fdi: 14, name: "Upper Right 1st Premolar", quadrant: "Q1" },
    { number: 6, fdi: 13, name: "Upper Right Canine", quadrant: "Q1" },
    { number: 7, fdi: 12, name: "Upper Right Lateral Incisor", quadrant: "Q1" },
    { number: 8, fdi: 11, name: "Upper Right Central Incisor", quadrant: "Q1" },

    // Quadrant 2 (Upper Left)
    { number: 9, fdi: 21, name:  "Upper Left Central Incisor", quadrant: "Q2" },
    { number: 10, fdi: 22, name: "Upper Left Lateral Incisor", quadrant: "Q2" },
    { number: 11, fdi: 23, name: "Upper Left Canine", quadrant: "Q2" },
    { number: 12, fdi: 24, name: "Upper Left 1st Premolar", quadrant: "Q2" },
    { number: 13, fdi: 25, name: "Upper Left 2nd Premolar", quadrant: "Q2" },
    { number: 14, fdi: 26, name: "Upper Left 1st Molar", quadrant: "Q2" },
    { number: 15, fdi: 27, name: "Upper Left 2nd Molar", quadrant: "Q2" },
    { number: 16, fdi: 28, name: "Upper Left 3rd Molar (Wisdom)", quadrant: "Q2" },
  ],
  lower: [
    // Quadrant 4 (Lower Right)
    { number: 32, fdi: 48, name: "Lower Right 3rd Molar (Wisdom)", quadrant: "Q4" },
    { number: 31, fdi: 47, name: "Lower Right 2nd Molar", quadrant: "Q4" },
    { number: 30, fdi: 46, name: "Lower Right 1st Molar", quadrant: "Q4" },
    { number: 29, fdi: 45, name: "Lower Right 2nd Premolar", quadrant: "Q4" },
    { number: 28, fdi: 44, name: "Lower Right 1st Premolar", quadrant: "Q4" },
    { number: 27, fdi: 43, name: "Lower Right Canine", quadrant: "Q4" },
    { number: 26, fdi: 42, name: "Lower Right Lateral Incisor", quadrant: "Q4" },
    { number: 25, fdi: 41, name: "Lower Right Central Incisor", quadrant: "Q4" },

    // Quadrant 3 (Lower Left)
    { number: 24, fdi: 31, name: "Lower Left Central Incisor", quadrant: "Q3" },
    { number: 23, fdi: 32, name: "Lower Left Lateral Incisor", quadrant: "Q3" },
    { number: 22, fdi: 33, name: "Lower Left Canine", quadrant: "Q3" },
    { number: 21, fdi: 34, name: "Lower Left 1st Premolar", quadrant: "Q3" },
    { number: 20, fdi: 35, name: "Lower Left 2nd Premolar", quadrant: "Q3" },
    { number: 19, fdi: 36, name: "Lower Left 1st Molar", quadrant: "Q3" },
    { number: 18, fdi: 37, name: "Lower Left 2nd Molar", quadrant: "Q3" },
    { number: 17, fdi: 38, name: "Lower Left 3rd Molar (Wisdom)", quadrant: "Q3" },
  ],
};

// Pediatric 20 Primary Teeth Definitions
export const PEDIATRIC_TEETH = {
  upper: [
    { number: "A", fdi: 55, name: "Upper Right 2nd Primary Molar", quadrant: "Q5" },
    { number: "B", fdi: 54, name: "Upper Right 1st Primary Molar", quadrant: "Q5" },
    { number: "C", fdi: 53, name: "Upper Right Primary Canine", quadrant: "Q5" },
    { number: "D", fdi: 52, name: "Upper Right Primary Lateral", quadrant: "Q5" },
    { number: "E", fdi: 51, name: "Upper Right Primary Central", quadrant: "Q5" },
    { number: "F", fdi: 61, name: "Upper Left Primary Central", quadrant: "Q6" },
    { number: "G", fdi: 62, name: "Upper Left Primary Lateral", quadrant: "Q6" },
    { number: "H", fdi: 63, name: "Upper Left Primary Canine", quadrant: "Q6" },
    { number: "I", fdi: 64, name: "Upper Left Primary 1st Molar", quadrant: "Q6" },
    { number: "J", fdi: 65, name: "Upper Left Primary 2nd Molar", quadrant: "Q6" },
  ],
  lower: [
    { number: "T", fdi: 85, name: "Lower Right 2nd Primary Molar", quadrant: "Q8" },
    { number: "S", fdi: 84, name: "Lower Right 1st Primary Molar", quadrant: "Q8" },
    { number: "R", fdi: 83, name: "Lower Right Primary Canine", quadrant: "Q8" },
    { number: "Q", fdi: 82, name: "Lower Right Primary Lateral", quadrant: "Q8" },
    { number: "P", fdi: 81, name: "Lower Right Primary Central", quadrant: "Q8" },
    { number: "O", fdi: 71, name: "Lower Left Primary Central", quadrant: "Q7" },
    { number: "N", fdi: 72, name: "Lower Left Primary Lateral", quadrant: "Q7" },
    { number: "M", fdi: 73, name: "Lower Left Primary Canine", quadrant: "Q7" },
    { number: "L", fdi: 74, name: "Lower Left Primary 1st Molar", quadrant: "Q7" },
    { number: "K", fdi: 75, name: "Lower Left Primary 2nd Molar", quadrant: "Q7" },
  ],
};

export const DentalChart = ({
  teethData = {},
  selectedTooth = null,
  notation = 'universal',
  chartType = 'adult',
  onSelectTooth,
  onSurfaceClick,
}) => {
  const [archFilter, setArchFilter] = useState('both'); // 'both' | 'upper' | 'lower'
  const teethSet = chartType === 'pediatric' ? PEDIATRIC_TEETH : ADULT_TEETH;

  const getToothData = (tooth) => {
    if (!teethData || typeof teethData !== 'object') return {};
    return teethData[tooth.fdi] || teethData[tooth.number] || teethData[String(tooth.fdi)] || teethData[String(tooth.number)] || {};
  };

  const isToothSelected = (tooth) => {
    return selectedTooth === tooth.fdi || selectedTooth === tooth.number || String(selectedTooth) === String(tooth.fdi) || String(selectedTooth) === String(tooth.number);
  };

  return (
    <div className="flex flex-col w-full bg-slate-50/70 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 md:p-6 border border-slate-200 shadow-xs">
      
      {/* Arch Filter Controls & Scroll Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setArchFilter('both')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
              archFilter === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Both Arches
          </button>
          <button
            type="button"
            onClick={() => setArchFilter('upper')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
              archFilter === 'upper' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upper ({chartType === 'pediatric' ? 'A–J' : '1–16'})
          </button>
          <button
            type="button"
            onClick={() => setArchFilter('lower')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
              archFilter === 'lower' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lower ({chartType === 'pediatric' ? 'K–T' : '17–32'})
          </button>
        </div>

        <div className="text-[10px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1">
          <span>↔ Scroll horizontally for all teeth</span>
        </div>
      </div>

      {/* UPPER ARCH (shown when 'both' or 'upper') */}
      {(archFilter === 'both' || archFilter === 'upper') && (
        <div className="flex flex-col mb-3">
          {/* Upper Arch Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs font-bold mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-800 bg-blue-50 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                Right (Patient)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm">
              <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-center">
                Maxillary Arch (Upper Jaw)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-blue-800 bg-blue-50 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                Left (Patient)
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            </div>
          </div>

          {/* UPPER ARCH CONTAINER */}
          <div className="bg-white p-3 sm:p-4 pt-3 pb-5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto touch-pan-x [scrollbar-width:thin]">
            {/* Quadrant Subheaders */}
            <div className="flex items-center justify-between text-[11px] font-black text-blue-700 uppercase tracking-wider mb-2.5 px-2 min-w-[880px]">
              <span>{chartType === 'pediatric' ? 'Quadrant 5 (Upper Right)' : 'Quadrant 1 (Upper Right)'}</span>
              <span>{chartType === 'pediatric' ? 'Quadrant 6 (Upper Left)' : 'Quadrant 2 (Upper Left)'}</span>
            </div>

            <div className="flex items-center justify-between gap-2 min-w-[880px]">
              {/* Quadrant 1 (Right) */}
              <div className="flex items-center gap-1.5 flex-1 justify-end pr-3 border-r-2 border-dashed border-slate-300">
                {teethSet.upper.slice(0, teethSet.upper.length / 2).map((tooth) => (
                  <Tooth
                    key={tooth.number}
                    number={tooth.number}
                    fdiNumber={tooth.fdi}
                    name={tooth.name}
                    data={getToothData(tooth)}
                    isSelected={isToothSelected(tooth)}
                    notation={notation}
                    isUpper={true}
                    onSelect={onSelectTooth}
                    onSurfaceClick={onSurfaceClick}
                  />
                ))}
              </div>

              {/* Quadrant 2 (Left) */}
              <div className="flex items-center gap-1.5 flex-1 justify-start pl-3">
                {teethSet.upper.slice(teethSet.upper.length / 2).map((tooth) => (
                  <Tooth
                    key={tooth.number}
                    number={tooth.number}
                    fdiNumber={tooth.fdi}
                    name={tooth.name}
                    data={getToothData(tooth)}
                    isSelected={isToothSelected(tooth)}
                    notation={notation}
                    isUpper={true}
                    onSelect={onSelectTooth}
                    onSurfaceClick={onSurfaceClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Occlusal Midline Plane (shown when 'both') */}
      {archFilter === 'both' && (
        <div className="relative flex items-center justify-center my-2">
          <div className="w-full border-t-2 border-slate-300 border-dashed" />
          <span className="absolute bg-white border border-slate-300 text-slate-700 text-[11px] font-black px-4 py-0.5 rounded-full uppercase tracking-widest shadow-xs">
            Occlusal Midline Plane
          </span>
        </div>
      )}

      {/* LOWER ARCH (shown when 'both' or 'lower') */}
      {(archFilter === 'both' || archFilter === 'lower') && (
        <div className="flex flex-col mt-2">
          {/* Lower Arch Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs font-bold mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-blue-800 bg-blue-50 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                Right (Patient)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm">
              <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-center">
                Mandibular Arch (Lower Jaw)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-blue-800 bg-blue-50 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                Left (Patient)
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            </div>
          </div>

          {/* LOWER ARCH CONTAINER */}
          <div className="bg-white p-3 sm:p-4 pt-3 pb-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto touch-pan-x [scrollbar-width:thin]">
            {/* Quadrant Subheaders */}
            <div className="flex items-center justify-between text-[11px] font-black text-blue-700 uppercase tracking-wider mb-2.5 px-2 min-w-[880px]">
              <span>{chartType === 'pediatric' ? 'Quadrant 8 (Lower Right)' : 'Quadrant 4 (Lower Right)'}</span>
              <span>{chartType === 'pediatric' ? 'Quadrant 7 (Lower Left)' : 'Quadrant 3 (Lower Left)'}</span>
            </div>

            <div className="flex items-center justify-between gap-2 min-w-[880px] pb-1">
              {/* Quadrant 4 (Right) */}
              <div className="flex items-center gap-1.5 flex-1 justify-end pr-3 border-r-2 border-dashed border-slate-300">
                {teethSet.lower.slice(0, teethSet.lower.length / 2).map((tooth) => (
                  <Tooth
                    key={tooth.number}
                    number={tooth.number}
                    fdiNumber={tooth.fdi}
                    name={tooth.name}
                    data={getToothData(tooth)}
                    isSelected={isToothSelected(tooth)}
                    notation={notation}
                    isUpper={false}
                    onSelect={onSelectTooth}
                    onSurfaceClick={onSurfaceClick}
                  />
                ))}
              </div>

              {/* Quadrant 3 (Left) */}
              <div className="flex items-center gap-1.5 flex-1 justify-start pl-3">
                {teethSet.lower.slice(teethSet.lower.length / 2).map((tooth) => (
                  <Tooth
                    key={tooth.number}
                    number={tooth.number}
                    fdiNumber={tooth.fdi}
                    name={tooth.name}
                    data={getToothData(tooth)}
                    isSelected={isToothSelected(tooth)}
                    notation={notation}
                    isUpper={false}
                    onSelect={onSelectTooth}
                    onSurfaceClick={onSurfaceClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
