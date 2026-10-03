import React, { useState, useEffect } from 'react';
import { Activity, Check, Circle, ChevronDown, ChevronUp, ShieldCheck, RefreshCw, Radio, Satellite, AlertTriangle } from 'lucide-react';
import { PipelineStatus, ApiHealth } from '../../types/geospatial';
import { apiHealthService } from '../../services/apiHealthService';

interface GeospatialPipelineStatusPanelProps {
  status: PipelineStatus;
}

export const GeospatialPipelineStatusPanel: React.FC<GeospatialPipelineStatusPanelProps> = ({ status }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'pipeline'>('services');
  const [healthMap, setHealthMap] = useState<Record<string, ApiHealth>>({});
  const [isChecking, setIsChecking] = useState(false);

  const fetchHealth = async () => {
    setIsChecking(true);
    try {
      const results = await apiHealthService.runHealthChecks();
      setHealthMap(results);
    } catch {
      // Keep existing state on error
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const serviceList = [
    { key: 'osm', name: 'OpenStreetMap', defaultStatus: 'CONNECTED' },
    { key: 'bhuvan', name: 'Bhuvan / ISRO', defaultStatus: 'NOT_INTEGRATED' },
    { key: 'copernicus', name: 'Copernicus', defaultStatus: 'CONNECTED' },
    { key: 'soi', name: 'Survey of India', defaultStatus: 'REFERENCE' },
    { key: 'dem', name: 'SRTM / DEM', defaultStatus: 'NOT_INTEGRATED' },
    { key: 'lidar', name: 'LiDAR', defaultStatus: 'PLANNED' },
    { key: 'naksha', name: 'NAKSHA', defaultStatus: 'DEMO' },
  ];

  return (
    <div className="pointer-events-auto">
      {/* Compact Badge Button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          title="Inspect Geospatial Data Services & Pipeline Status"
          className="gis-glass-panel px-3 py-1.5 rounded-full border border-zinc-800 text-xs font-mono flex items-center space-x-2 text-zinc-200 hover:border-zinc-600 shadow-lg group transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="font-semibold tracking-wide group-hover:text-white">
            GEO SERVICES & PIPELINE
          </span>
          <span className="text-[10px] text-black font-bold bg-white px-1.5 py-0.2 rounded border border-white">
            LIVE
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
        </button>
      ) : (
        /* Expanded Technical Ingestion Telemetry Card */
        <div className="gis-glass-panel rounded-2xl p-4 w-80 sm:w-96 border border-zinc-800 shadow-2xl animate-fadeIn text-zinc-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2.5">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-white" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Geospatial Engine
              </h4>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={fetchHealth}
                title="Run API Health Checks"
                disabled={isChecking}
                className="p-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tabs: Data Services vs Pipeline Stages */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl mb-3 border border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              DATA SERVICES
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PIPELINE STAGES
            </button>
          </div>

          {/* Tab 1: Geospatial Data Services */}
          {activeTab === 'services' && (
            <div className="space-y-2 text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5 flex items-center justify-between">
                <span>GEOSPATIAL DATA SERVICES</span>
                <span className="text-zinc-500 font-normal">
                  {isChecking ? 'Checking...' : 'Live Telemetry'}
                </span>
              </div>

              {serviceList.map((svc) => {
                const liveHealth = healthMap[svc.key];
                const displayStatus = liveHealth ? liveHealth.status : svc.defaultStatus;
                const isConnected = displayStatus === 'CONNECTED';
                const isFailed = displayStatus === 'FAILED';

                return (
                  <div key={svc.key} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black" />
                        </div>
                      ) : isFailed ? (
                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                          <AlertTriangle className="w-2.5 h-2.5 text-zinc-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                          <Circle className="w-2 h-2 text-zinc-500" />
                        </div>
                      )}
                      <span className="text-zinc-200 text-[11px]">{svc.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide ${
                        isConnected
                          ? 'text-black bg-white border border-white font-bold'
                          : 'text-zinc-400 bg-zinc-900 border border-zinc-800'
                      }`}
                    >
                      {displayStatus === 'NOT_INTEGRATED'
                        ? 'NOT INTEGRATED'
                        : displayStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Pipeline Stages */}
          {activeTab === 'pipeline' && (
            <div className="space-y-2 text-xs font-mono">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                CADASTRE PIPELINE STAGES
              </div>

              {status.stages.map((stage) => {
                const isLoaded = stage.status === 'LOADED';
                const isAvailable = stage.status === 'AVAILABLE';

                return (
                  <div key={stage.id} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center space-x-2">
                      {isLoaded || isAvailable ? (
                        <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                          <Circle className="w-2 h-2 text-zinc-500" />
                        </div>
                      )}
                      <span className="text-zinc-300 text-[11px]">{stage.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isLoaded
                          ? 'text-black bg-white font-bold border border-white'
                          : isAvailable
                          ? 'text-zinc-200 bg-zinc-800 border border-zinc-700'
                          : 'text-zinc-400 bg-zinc-900 border border-zinc-800'
                      }`}
                    >
                      {stage.status === 'LOADED'
                        ? 'Loaded'
                        : stage.status === 'AVAILABLE'
                        ? 'Available'
                        : stage.status === 'DEMO'
                        ? 'Demo'
                        : stage.status === 'NOT_INTEGRATED'
                        ? 'Not Integrated'
                        : 'Planned'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">CRS: {status.coordinateReference.split(' ')[0]}</span>
            <div className="flex items-center gap-1 text-white font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              <span>Validation: {status.validationStatus}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
