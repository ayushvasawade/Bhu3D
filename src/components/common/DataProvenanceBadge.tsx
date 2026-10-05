import React from 'react';
import { ProvenanceStatus } from '../../types/intelligence';
import { CheckCircle2, Layers, Calculator, FlaskConical, MinusCircle } from 'lucide-react';

interface DataProvenanceBadgeProps {
  status: ProvenanceStatus;
  label?: string;
  sourceText?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
  status,
  label,
  sourceText,
  size = 'sm',
  showIcon = true
}) => {
  const getStyle = () => {
    switch (status) {
      case 'REAL':
        return {
          bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500 font-bold shadow-sm',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        };
      case 'DERIVED':
        return {
          bg: 'bg-cyan-950/90 text-cyan-300 border-cyan-500 font-bold shadow-sm',
          icon: <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
        };
      case 'ESTIMATED':
        return {
          bg: 'bg-amber-950/90 text-amber-300 border-dashed border-amber-500 font-bold shadow-sm',
          icon: <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
        };
      case 'DEMO':
        return {
          bg: 'bg-purple-950/90 text-purple-300 border-purple-500 font-bold shadow-sm',
          icon: <FlaskConical className="w-3 h-3 text-purple-400 shrink-0" />
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-rose-950/70 text-rose-300 border-rose-800 font-bold',
          icon: <MinusCircle className="w-3 h-3 text-rose-400 shrink-0" />
        };
    }
  };

  const current = getStyle();
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded-md border ${current.bg} ${textSize} ${padding}`}
      title={`Data Provenance Status: ${status}${sourceText ? ` (${sourceText})` : ''}`}
    >
      {showIcon && current.icon}
      <span>{label || status}</span>
      {sourceText && (
        <>
          <span className="opacity-40">·</span>
          <span className="font-normal capitalize font-sans tracking-normal opacity-90 truncate max-w-[150px]">{sourceText}</span>
        </>
      )}
    </span>
  );
};
