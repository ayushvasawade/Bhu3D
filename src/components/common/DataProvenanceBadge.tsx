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
          bg: 'bg-white text-black border-white shadow-sm font-bold',
          icon: <CheckCircle2 className="w-3 h-3 text-black shrink-0" />
        };
      case 'DERIVED':
        return {
          bg: 'bg-zinc-800 text-zinc-100 border-zinc-600',
          icon: <Layers className="w-3 h-3 text-zinc-300 shrink-0" />
        };
      case 'ESTIMATED':
        return {
          bg: 'bg-zinc-900 text-zinc-300 border-dashed border-zinc-500',
          icon: <Calculator className="w-3 h-3 text-zinc-400 shrink-0" />
        };
      case 'DEMO':
        return {
          bg: 'bg-zinc-900 text-zinc-300 border-zinc-700',
          icon: <FlaskConical className="w-3 h-3 text-zinc-400 shrink-0" />
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-black text-zinc-500 border-zinc-800',
          icon: <MinusCircle className="w-3 h-3 text-zinc-600 shrink-0" />
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
