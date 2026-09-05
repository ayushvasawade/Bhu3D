import React, { useState } from 'react';
import {
  ChevronLeft,
  Maximize2,
  Copy,
  Check,
  MapPin,
  ShieldCheck,
  Layers,
  Building,
  Info,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react';
import { PropertyRecord, RoomItem, DataSourceItem } from '../../types/property';
import { Apartment3DViewer } from './Apartment3DViewer';
import { DataSourcesGrid } from './DataSourcesGrid';

interface PropertyDetailsPanelProps {
  property: PropertyRecord;
  onBack?: () => void;
  onOpenFullscreen3D?: () => void;
  onSelectSource?: (source: DataSourceItem) => void;
}

export const PropertyDetailsPanel: React.FC<PropertyDetailsPanelProps> = ({
  property,
  onBack,
  onOpenFullscreen3D,
  onSelectSource
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(property.propertyId3D);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="gis-glass-panel rounded-3xl p-4 sm:p-5 w-80 sm:w-[420px] max-h-[calc(100vh-5rem)] overflow-y-auto shadow-2xl pointer-events-auto transition-all duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-sky-500/20 mb-3">
        <div className="flex items-center space-x-2.5">
          {onBack && (
            <button
              onClick={onBack}
              title="Previous View"
              className="p-1.5 rounded-xl bg-slate-900/80 border border-sky-500/20 text-slate-300 hover:text-white hover:border-sky-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              {property.ownerName}'s Property
            </h2>
            <div className="flex items-center space-x-1 text-xs text-sky-400 font-medium">
              <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate">
                {property.city}, {property.state}, {property.country}
              </span>
            </div>
          </div>
        </div>

        {onOpenFullscreen3D && (
          <button
            onClick={onOpenFullscreen3D}
            title="Expand 3D Inspector"
            className="p-2 rounded-xl bg-slate-900/80 border border-sky-500/20 text-slate-300 hover:text-white hover:border-sky-400 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3D Apartment / Building Preview */}
      <div className="mb-4">
        <Apartment3DViewer
          property={property}
          onOpenFullscreen={onOpenFullscreen3D}
          selectedRoomId={selectedRoom?.id}
          onSelectRoom={setSelectedRoom}
        />
      </div>

      {/* Property Details Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Property Details
          </h3>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verified (Demo)
          </span>
        </div>

        {/* Details Table */}
        <div className="space-y-2 text-xs divide-y divide-slate-800/60 font-medium">
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400">Owner Name</span>
            <span className="text-slate-100 font-semibold">
              {property.ownerName} <span className="text-slate-500 text-[10px] font-normal">(Demo Data)</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="text-slate-400">Property Type</span>
            <span className="text-slate-200">{property.propertyType}</span>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="text-slate-400">Floor</span>
            <span className="text-slate-200">{property.floor} ({property.unitNumber})</span>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="text-slate-400">Built-up Area</span>
            <span className="text-slate-100 font-mono font-semibold">
              {property.builtUpArea} m² <span className="text-slate-400 font-normal text-[11px]">(Carpet: {property.carpetArea} m²)</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="text-slate-400">3D Property ID</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-sky-300 font-mono font-semibold text-[11px] bg-slate-900/90 px-2 py-0.5 rounded border border-sky-500/20">
                {property.propertyId3D}
              </span>
              <button
                onClick={handleCopyId}
                title="Copy 3D Property ID"
                className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-800/80 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5">
            <span className="text-slate-400">Status</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified (Demo)
            </span>
          </div>
        </div>

        {/* Expandable Technical Cadastral Slicing Details */}
        <div className="pt-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-sky-500/20 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Vertical Cadastre & 3D ULPIN Architecture
            </span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-sky-500/20 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Standard 2D ULPIN:</span>
                <span className="font-mono text-slate-200">{property.ulpinStandard14}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full 3D Bhu-Aadhaar:</span>
                <span className="font-mono text-[11px] text-sky-300">{property.ulpin3D}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Survey & Ward:</span>
                <span className="text-slate-300">Surv {property.cadastreDetails.surveyNumber} · {property.cadastreDetails.wardNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Elevation Z (AMSL):</span>
                <span className="text-slate-300">{property.coordinates.altitudeAMSL}m (+{property.coordinates.heightAGL}m AGL)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Undivided Land Share (UDS):</span>
                <span className="text-slate-300">{property.undividedLandShare} m²</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Title Deed Reg:</span>
                <span className="text-slate-300">{property.cadastreDetails.titleDeedNumber} ({property.cadastreDetails.registrationYear})</span>
              </div>
            </div>
          )}
        </div>

        {/* Data Provenance Section */}
        <div className="pt-2">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-sky-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-sky-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                Data Provenance
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                BLD-PUN-00027
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Geometry Source:</span>
                <span className="text-emerald-400 font-medium">OpenStreetMap (Connected)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Height Source:</span>
                <span className="text-slate-200">Estimated / Demo (46.5m)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Elevation:</span>
                <span className="text-amber-300 font-medium">Demo / Estimated (582m)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Satellite Context:</span>
                <span className="text-emerald-400 font-medium">Copernicus Sentinel-2 (Connected)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Parcel:</span>
                <span className="text-sky-300">Demo Parcel Dataset (42/1A)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ownership:</span>
                <span className="text-amber-300">Simulated Prototype Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Grid */}
      <DataSourcesGrid onSelectSource={onSelectSource} />
    </div>
  );
};
