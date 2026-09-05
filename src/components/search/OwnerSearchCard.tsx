import React, { useState } from 'react';
import { Search, User, X, Sparkles } from 'lucide-react';
import { PropertyRecord } from '../../types/property';

interface OwnerSearchCardProps {
  currentProperty: PropertyRecord;
  properties: PropertyRecord[];
  onSelectProperty: (property: PropertyRecord) => void;
}

export const OwnerSearchCard: React.FC<OwnerSearchCardProps> = ({
  currentProperty,
  properties,
  onSelectProperty
}) => {
  const [searchTerm, setSearchTerm] = useState(currentProperty.ownerName);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Find match by owner name or city or unit
    const found = properties.find(
      p =>
        p.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.buildingName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (found) {
      onSelectProperty(found);
      setSearchTerm(found.ownerName);
    }
  };

  const handleQuickSelect = (property: PropertyRecord) => {
    setSearchTerm(property.ownerName);
    onSelectProperty(property);
  };

  return (
    <div className="gis-glass-panel rounded-2xl p-4 w-72 sm:w-80 shadow-2xl pointer-events-auto transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="owner-search-input" className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-sky-400" />
          Enter your name
        </label>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-500/30 text-sky-300">
          Demo Search
        </span>
      </div>

      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="relative w-full flex items-center">
          <input
            id="owner-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search property owner..."
            className="w-full h-11 pl-9 pr-12 rounded-xl bg-slate-900/80 border border-sky-500/30 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium"
          />
          <User className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-12 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className="absolute right-1.5 h-8 w-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-all shadow-glow-cyan"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested demo names */}
      <div className="mt-2.5">
        <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5 font-medium">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Suggested demo records:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {properties.map((p) => {
            const isSelected = p.id === currentProperty.id;
            return (
              <button
                key={p.id}
                onClick={() => handleQuickSelect(p)}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50'
                }`}
              >
                {p.ownerName} ({p.city})
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-slate-400/80 italic">
          e.g. Saharsh, Priya, Rohan... (simulated cadastre data)
        </p>
      </div>
    </div>
  );
};
