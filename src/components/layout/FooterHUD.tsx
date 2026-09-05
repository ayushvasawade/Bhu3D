import React from 'react';
import { Compass, Database, ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewLevel } from '../../types/property';
import { formatCoordinates, formatAltitude } from '../../utils/coordinates';

interface FooterHUDProps {
  currentLevel: ViewLevel;
  onSelectLevel: (level: ViewLevel) => void;
  coordinates: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  heading?: number;
}

const VIEW_LEVELS: ViewLevel[] = ['global', 'city', 'buildings', 'layers', 'ownership'];

export const FooterHUD: React.FC<FooterHUDProps> = ({
  currentLevel,
  onSelectLevel,
  coordinates,
  heading = 0
}) => {
  const currentIndex = VIEW_LEVELS.indexOf(currentLevel);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectLevel(VIEW_LEVELS[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < VIEW_LEVELS.length - 1) {
      onSelectLevel(VIEW_LEVELS[currentIndex + 1]);
    }
  };

  return (
    <>
      {/* Bottom-Left Telemetry & HUD */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center space-x-3 pointer-events-auto">
        {/* Compass Widget */}
        <div
          title={`Heading: ${Math.round(heading)}°`}
          className="relative w-12 h-12 rounded-full bg-slate-950/80 border border-sky-500/30 flex items-center justify-center backdrop-blur-md shadow-lg group hover:border-sky-400 cursor-pointer"
        >
          <div
            className="transition-transform duration-300 flex items-center justify-center"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            <Compass className="w-7 h-7 text-sky-400 group-hover:text-cyan-300" />
          </div>
          <span className="absolute top-1 text-[9px] font-bold text-rose-400">N</span>
        </div>

        {/* Coordinates and Source Ticker */}
        <div className="gis-glass-panel px-3.5 py-2 rounded-xl text-xs font-mono flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-sky-950/70 px-1.5 py-0.5 rounded border border-sky-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              CESIUM ion
            </span>
            <span className="text-[10px] text-slate-400">WGS84 Ellipsoid</span>
          </div>
          <div className="text-[11px] text-slate-200 tracking-wider">
            {formatCoordinates(coordinates.latitude, coordinates.longitude)}
            <span className="mx-2 text-sky-500/40">|</span>
            <span className="text-sky-300">Altitude: {formatAltitude(coordinates.altitude)}</span>
          </div>
        </div>
      </div>

      {/* Bottom-Center Step Progression Banner */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="gis-glass-panel px-5 py-2.5 rounded-full flex items-center space-x-4 shadow-2xl border border-sky-500/30">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Previous Progression Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-200 tracking-wide">
              From Global View to Individual Property — All in 3D
            </span>
            {/* Step indicators */}
            <div className="flex items-center space-x-2 mt-1.5">
              {VIEW_LEVELS.map((level, idx) => {
                const isActive = level === currentLevel;
                const isPassed = idx < currentIndex;
                return (
                  <button
                    key={level}
                    onClick={() => onSelectLevel(level)}
                    title={`Go to ${level.toUpperCase()}`}
                    className={`transition-all duration-300 rounded-full ${
                      isActive
                        ? 'w-6 h-2 bg-sky-400 shadow-glow-cyan'
                        : isPassed
                        ? 'w-2 h-2 bg-sky-600'
                        : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === VIEW_LEVELS.length - 1}
            className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Next Progression Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};
