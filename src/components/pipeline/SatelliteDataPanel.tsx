import React, { useEffect, useState } from 'react';
import { Satellite, CheckCircle2, AlertCircle, Clock, Cloud, RefreshCw } from 'lucide-react';
import { SentinelScene } from '../../types/geospatial';
import { copernicusService } from '../../services/copernicusService';

interface SatelliteDataPanelProps {
  aoiName?: string;
}

export const SatelliteDataPanel: React.FC<SatelliteDataPanelProps> = ({ aoiName = 'Pune (Tile T43QDA)' }) => {
  const [scenes, setScenes] = useState<SentinelScene[]>([]);
  const [status, setStatus] = useState<'LOADING' | 'CONNECTED' | 'FAILED' | 'NOT_CONFIGURED'>('LOADING');
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchSentinelData = async () => {
    setStatus('LOADING');
    try {
      const results = await copernicusService.searchSentinel2({ tileId: 'T43QDA', limit: 2 });
      if (results.length > 0) {
        setScenes(results);
        setStatus('CONNECTED');
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        setStatus('FAILED');
      }
    } catch {
      setStatus('FAILED');
    }
  };

  useEffect(() => {
    fetchSentinelData();
  }, []);

  const latestScene = scenes[0];

  return (
    <div className="pointer-events-auto">
      {/* Compact Header Badge */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          title="Inspect Live Copernicus Sentinel-2 Satellite Telemetry"
          className="gis-glass-panel px-3 py-1.5 rounded-full border border-zinc-800 text-xs font-mono flex items-center space-x-2 text-zinc-200 hover:border-zinc-600 shadow-lg group transition-all"
        >
          <Satellite className="w-3.5 h-3.5 text-white group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wide">
            SENTINEL-2
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
              status === 'CONNECTED'
                ? 'text-black bg-white border-white'
                : 'text-zinc-400 bg-zinc-900 border-zinc-800'
            }`}
          >
            {status}
          </span>
        </button>
      ) : (
        /* Expanded Satellite Telemetry Card */
        <div className="gis-glass-panel rounded-2xl p-4 w-72 sm:w-84 border border-zinc-800 shadow-2xl animate-fadeIn font-mono text-zinc-100">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2.5">
            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-white" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Satellite Data
              </h4>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={fetchSentinelData}
                title="Refresh Satellite Scenes"
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status === 'LOADING' ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Mission:</span>
              <span className="text-white font-semibold">Sentinel-2 (MSI)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Provider:</span>
              <span className="text-zinc-300">Copernicus Data Space</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">AOI Tile:</span>
              <span className="text-white font-semibold">{aoiName}</span>
            </div>

            {latestScene && (
              <>
                <div className="pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400 block text-[10px] mb-0.5">Latest Available Scene:</span>
                  <span className="text-zinc-200 text-[10px] font-semibold break-all leading-tight block">
                    {latestScene.name}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    Acquired:
                  </span>
                  <span className="text-white font-medium text-[11px]">
                    {latestScene.acquisitionDate.split('.')[0].replace('T', ' ')} UTC
                  </span>
                </div>

                {latestScene.cloudCover !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-zinc-400" />
                      Cloud Cover:
                    </span>
                    <span className="text-zinc-200">
                      {latestScene.cloudCover}%
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-500 text-[10px]">
                {lastRefreshed ? `Checked: ${lastRefreshed}` : 'Live REST OData'}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {status === 'CONNECTED' ? (
                  <span className="text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    API: CONNECTED
                  </span>
                ) : status === 'LOADING' ? (
                  <span className="text-zinc-400">CONNECTING...</span>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-zinc-400" />
                    API: {status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
