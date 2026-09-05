import React, { useEffect, useState } from 'react';
import { X, Database, ShieldAlert, CheckCircle2, AlertCircle, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { DATA_SOURCE_REGISTRY } from '../../config/dataSources';
import { apiHealthService } from '../../services/apiHealthService';
import { ApiHealth, DataSourceMetadata } from '../../types/geospatial';

interface DataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSourcesModal: React.FC<DataSourcesModalProps> = ({ isOpen, onClose }) => {
  const [healthMap, setHealthMap] = useState<Record<string, ApiHealth>>({});
  const [loading, setLoading] = useState(false);

  const fetchLiveHealth = async () => {
    setLoading(true);
    try {
      const results = await apiHealthService.runHealthChecks();
      setHealthMap(results);
    } catch {
      // Fallback to static registry statuses
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getSourceLiveStatus = (source: DataSourceMetadata): { status: string; label: string; style: string } => {
    const live = healthMap[source.id];
    const status = live ? live.status : source.status;

    switch (status) {
      case 'CONNECTED':
        return {
          status: 'CONNECTED',
          label: 'CONNECTED',
          style: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
        };
      case 'FAILED':
        return {
          status: 'FAILED',
          label: 'CONNECTION FAILED',
          style: 'bg-rose-950/80 text-rose-300 border-rose-500/40'
        };
      case 'NOT_INTEGRATED':
        return {
          status: 'NOT_INTEGRATED',
          label: 'NOT INTEGRATED',
          style: 'bg-slate-800/80 text-slate-300 border-slate-700'
        };
      case 'NOT_CONFIGURED':
        return {
          status: 'NOT_CONFIGURED',
          label: 'NOT CONFIGURED',
          style: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        };
      case 'REFERENCE':
        return {
          status: 'REFERENCE',
          label: 'REFERENCE',
          style: 'bg-sky-950/80 text-sky-300 border-sky-500/40'
        };
      case 'DEMO':
        return {
          status: 'DEMO',
          label: 'DEMO',
          style: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        };
      case 'PLANNED':
        return {
          status: 'PLANNED',
          label: 'PLANNED',
          style: 'bg-purple-950/80 text-purple-300 border-purple-500/40'
        };
      case 'SIMULATED':
        return {
          status: 'SIMULATED',
          label: 'SIMULATED',
          style: 'bg-amber-950/80 text-amber-300 border-amber-500/40'
        };
      default:
        return {
          status: source.status,
          label: source.status,
          style: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="gis-glass-panel rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-y-auto border border-sky-500/30 p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pr-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-glow-cyan">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-semibold">
                Geospatial Service Registry
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                External Geospatial & Cadastral Data Sources
              </h2>
            </div>
          </div>
          <button
            onClick={fetchLiveHealth}
            disabled={loading}
            title="Refresh Service Connectivity Status"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-500/30 text-xs font-mono text-slate-300 hover:text-sky-300 hover:border-sky-400 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Check APIs</span>
          </button>
        </div>

        {/* Notice & Truthful Status Disclosure */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-sky-500/25 text-slate-300 text-xs flex items-start space-x-2.5 mb-5">
          <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">Truthful Service Disclosure: </strong>
            TerraID 3D directly interfaces with external geospatial endpoints. Only services passing active live HTTP/OData verification are marked <span className="text-emerald-400 font-mono font-bold">CONNECTED</span>. Services requiring credentials or internal networks are truthfully reported as <span className="text-rose-400 font-mono font-bold">FAILED / NOT INTEGRATED</span>.
          </div>
        </div>

        {/* Dynamic Source Registry Table (Requirement 14) */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden font-mono text-xs">
          <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
            <div className="col-span-5 sm:col-span-4">Source</div>
            <div className="col-span-4 sm:col-span-3 text-center">Status</div>
            <div className="col-span-3 sm:col-span-5 text-right sm:text-left">Type / Provider</div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {DATA_SOURCE_REGISTRY.map((src) => {
              const statusInfo = getSourceLiveStatus(src);
              return (
                <div key={src.id} className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-slate-900/40 transition-colors">
                  <div className="col-span-5 sm:col-span-4 font-semibold text-white truncate">
                    {src.name}
                  </div>
                  <div className="col-span-4 sm:col-span-3 flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-5 text-right sm:text-left text-slate-400 text-[11px] truncate">
                    {src.provider}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Data Source Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
            Detailed Source Specifications & Provenance
          </h3>

          {DATA_SOURCE_REGISTRY.map((source) => {
            const statusInfo = getSourceLiveStatus(source);
            const live = healthMap[source.id];

            return (
              <div
                key={source.id}
                className="gis-glass-card rounded-2xl p-4 border border-slate-700/60 hover:border-sky-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">
                      {source.name}
                    </h3>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-xs text-sky-400 font-semibold font-mono">
                    {source.purpose}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {source.description}
                </p>

                {live?.message && (
                  <div className="mb-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400">Live Telemetry:</span>
                    <span className={statusInfo.status === 'CONNECTED' ? 'text-emerald-300' : 'text-slate-300'}>
                      {live.message}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-1">
                  <span>Custodian: {source.provider}</span>
                  <span className="text-sky-400/90">{source.dataType}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Standards section */}
        <div className="mt-5 p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-sky-300 block mb-1">
            Compliant Geospatial Standards & Protocols
          </span>
          <p>
            • <strong>OGC WMS / WMTS & 3D Tiles:</strong> Web Map Service streaming specifications for basemaps and 3D geometry.
          </p>
          <p>
            • <strong>Copernicus OData REST API:</strong> ESA open catalogue query interface for Sentinel satellite imagery.
          </p>
          <p>
            • <strong>ISO 19152 LADM & EPSG:4326 / 7755:</strong> National coordinate reference frame and 3D land administration schema.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-sky-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm transition-all shadow-glow-cyan"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
