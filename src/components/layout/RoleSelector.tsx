import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  FileCheck2,
  HardHat,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { PrototypeRole, RoleDefinition } from '../../types/intelligence';

interface RoleSelectorProps {
  currentRole: PrototypeRole;
  onSelectRole: (role: PrototypeRole) => void;
}

const ROLES: RoleDefinition[] = [
  {
    id: 'survey_officer',
    title: 'Survey / GIS Officer',
    badge: 'GIS Officer',
    description: 'Direct measurement, geometry validation inspection & GeoJSON layer export',
    canValidate: true,
    canExport: true
  },
  {
    id: 'reviewer',
    title: 'Cadastral Reviewer',
    badge: 'Reviewer',
    description: 'Audit topological containment, evidence sources & confidence metrics',
    canValidate: true,
    canExport: false
  },
  {
    id: 'authority',
    title: 'Land Records Authority',
    badge: 'Authority',
    description: 'Statutory oversight, official ULPIN linkage status & passport verification',
    canValidate: false,
    canExport: true
  },
  {
    id: 'planner',
    title: 'Urban Town Planner',
    badge: 'Town Planner',
    description: '3D volume extents, estimated floor count & building height limits',
    canValidate: false,
    canExport: true
  },
  {
    id: 'citizen',
    title: 'Citizen / Public Viewer',
    badge: 'Citizen',
    description: 'Read-only public inspection of transparent data provenance & 3D buildings',
    canValidate: false,
    canExport: false
  }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  onSelectRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeDef = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <div className="relative pointer-events-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-white text-xs transition-all shadow-sm"
        title="Switch Prototype Role (Role-based UI Foundation)"
      >
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-zinc-400 font-mono leading-none">
            PROTOTYPE ROLE
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
            <span>{activeDef.badge}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 p-2 rounded-2xl bg-black/95 border border-zinc-700 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn divide-y divide-zinc-800 text-xs text-white">
          <div className="p-2 text-[10px] text-zinc-400 font-mono">
            SELECT ROLE (PROTOTYPE UI ARCHITECTURE)
          </div>
          <div className="py-1 space-y-1">
            {ROLES.map((r) => {
              const isSelected = r.id === currentRole;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelectRole(r.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-zinc-600'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="pr-2">
                    <div className="font-semibold text-xs flex items-center gap-1.5 text-white">
                      <span>{r.title}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 leading-snug mt-0.5 font-sans">
                      {r.description}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
          <div className="p-2 text-[9px] text-zinc-400 italic font-mono">
            Note: Role UI simulation. Real statutory queries require government SSO.
          </div>
        </div>
      )}
    </div>
  );
};
