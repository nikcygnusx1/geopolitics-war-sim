import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { MapLayer } from './MapControls';
import { BallisticStrike } from '../../types';

interface WorldMapProps {
  activeLayer: MapLayer;
}

export default function WorldMap({ activeLayer }: WorldMapProps) {
  const countries = useWorldStore((s) => s.countries);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const currentTick = useWorldStore((s) => s.currentTick);

  const playerCountryId = usePlayerStore((s) => s.countryId);
  const hudMode = usePlayerStore((s) => s.hudMode);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  // Bezier math for missile tracks
  function getBezierPoint(bezier: BallisticStrike['bezier'], t: number) {
    const x = (1 - t) * (1 - t) * bezier.startX + 2 * (1 - t) * t * bezier.controlX + t * t * bezier.endX;
    const y = (1 - t) * (1 - t) * bezier.startY + 2 * (1 - t) * t * bezier.controlY + t * t * bezier.endY;
    return { x, y };
  }

  const handleCountryClick = (id: string) => {
    if (hudMode === 'WAR_ROOM') {
      if (id !== playerCountryId) {
        setTargetCountry(id);
      }
    } else {
      setCountryInspector(id);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020402]">
      {/* Grid Coordinates watermark */}
      <div className="absolute top-1 left-2 text-[8px] font-mono text-green-900 pointer-events-none select-none tracking-widest leading-none">
        OPERATIONAL AREA VECTOR MATRIX GRID: WGS-84 LOCK DELTA: 12-B
      </div>

      <svg
        className="w-full h-full"
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="neon-glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neon-glow-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <feGaussianBlur id="blur-filter" stdDeviation="4" />
        </defs>

        {/* Global Coordinate Line Grid */}
        <g opacity="0.15">
          {Array.from({ length: 20 }).map((_, idx) => (
            <line
              key={`v-${idx}`}
              x1={idx * 50}
              y1="0"
              x2={idx * 50}
              y2="500"
              stroke="var(--color-green)"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 15 }).map((_, idx) => (
            <line
              key={`h-${idx}`}
              x1="0"
              y1={idx * 35}
              x2="1000"
              y2={idx * 35}
              stroke="var(--color-green)"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Outer Coordinate Compass Markings */}
        <text x="10" y="490" fill="#0c1a0c" fontSize="8" fontFamily="monospace">N 33.84277°</text>
        <text x="940" y="490" fill="#0c1a0c" fontSize="8" fontFamily="monospace">E 35.49211°</text>
        <text x="945" y="15" fill="#0c1a0c" fontSize="8" fontFamily="monospace">GRID B-40</text>

        {/* Land Polygons drawing */}
        <g>
          {Object.keys(GEO_COORDS).map((id) => {
            const geo = GEO_COORDS[id];
            const country = countries[id];
            if (!country) return null;

            const isPlayer = id === playerCountryId;
            const isSelected = id === selectedTargetId;
            const isAtWar = country.atWarWith.length > 0;

            // Determine Fill color based on current layer toggle
            let fill = 'rgba(10, 35, 10, 0.45)'; // standard neutral dim green
            let outline = 'rgba(0, 255, 68, 0.2)';
            let outlineWidth = '0.5';

            if (isPlayer) {
              fill = 'rgba(0, 255, 68, 0.15)';
              outline = '#00ff44';
              outlineWidth = '1.5';
            } else if (isSelected) {
              fill = 'rgba(255, 179, 0, 0.18)';
              outline = '#ffb300';
              outlineWidth = '1.5';
            }

            // Layer-Specific colors overrides
            if (activeLayer === 'POLITICAL') {
              if (isAtWar) {
                fill = 'rgba(255, 34, 68, 0.22)';
                outline = '#ff2244';
              } else if (country.allianceBlock === 'NATO') {
                fill = 'rgba(0, 229, 255, 0.15)'; // Blue tint for NATO
                outline = 'rgba(0, 229, 255, 0.4)';
              } else if (country.allianceBlock === 'SCO') {
                fill = 'rgba(255, 34, 68, 0.12)'; // Red tint for SCO
                outline = 'rgba(255, 34, 68, 0.35)';
              }
            } else if (activeLayer === 'MILITARY') {
              const rating = country.arsenal.totalPowerRating;
              if (rating > 2000) {
                fill = 'rgba(255, 34, 68, 0.25)'; // Hostile power overlay
              } else if (rating > 600) {
                fill = 'rgba(255, 179, 0, 0.18)';
              } else {
                fill = 'rgba(10, 35, 10, 0.15)';
              }
            } else if (activeLayer === 'ECONOMIC') {
              const stress = country.economic.debtStressIndex;
              if (stress > 70) {
                fill = 'rgba(255, 34, 68, 0.26)'; // high debt stress is blood read
              } else {
                fill = `rgba(0, 255, 68, ${Math.max(0.04, Math.min(0.3, (country.economic.gdpB / 30000)))})`;
              }
            }

            return (
              <g key={id} className="cursor-pointer group" onClick={() => handleCountryClick(id)}>
                <path
                  d={geo.path}
                  fill={fill}
                  stroke={outline}
                  strokeWidth={outlineWidth}
                  className="transition-all duration-350 hover:fill-green-950/40"
                />

                {/* Blinking Pulse Ring around selected target */}
                {isSelected && (
                  <circle
                    cx={geo.cx}
                    cy={geo.cy}
                    r={Math.max(geo.rx, geo.ry) + 20}
                    fill="none"
                    stroke="#ffb300"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    className="pulse-ring-map origin-center"
                    style={{ transformOrigin: `${geo.cx}px ${geo.cy}px` }}
                  />
                )}

                {/* Flag emoji on SVG capital center point */}
                <text
                  x={geo.cx - 8}
                  y={geo.cy + 4}
                  fontSize="12"
                  className="select-none pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity"
                >
                  {country.flagEmoji}
                </text>

                {/* ISO Text ID Labels */}
                <text
                  x={geo.labelX}
                  y={geo.labelY + 18}
                  fill={isPlayer ? '#00ff44' : isSelected ? '#ffb300' : 'rgba(0,255,68,0.5)'}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="font-bold select-none pointer-events-none tracking-widest uppercase"
                >
                  {id}
                </text>
              </g>
            );
          })}
        </g>

        {/* Dynamic weather (HAARP target anomalies) overlay */}
        {activeLayer === 'WEATHER' && (
          <g opacity="0.45">
            {Object.keys(countries).map((id) => {
              const c = countries[id];
              if (c && c.haarpActive && c.haarpTargetCountryId) {
                const targetGeo = GEO_COORDS[c.haarpTargetCountryId];
                if (targetGeo) {
                  return (
                    <g key={`haarp-cloud-${id}`} className="animate-pulse">
                      <circle
                        cx={targetGeo.cx}
                        cy={targetGeo.cy}
                        r="35"
                        fill="rgba(0, 229, 255, 0.28)"
                        stroke="#00e5ff"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={targetGeo.cx + 10}
                        cy={targetGeo.cy - 10}
                        r="25"
                        fill="rgba(0, 229, 255, 0.25)"
                      />
                      <text
                        x={targetGeo.cx}
                        y={targetGeo.cy - 2}
                        fill="#00e5ff"
                        fontSize="7"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        HAARP CLOUD
                      </text>
                    </g>
                  );
                }
              }
              return null;
            })}
          </g>
        )}

        {/* Cyber compromised links vectors map */}
        {activeLayer === 'CYBER' && (
          <g opacity="0.7">
            {Object.keys(countries).map((id) => {
              const c = countries[id];
              if (c && c.intelligence.activeCovertOps.length > 0) {
                return c.intelligence.activeCovertOps.map((op) => {
                  const srcGeo = GEO_COORDS[id];
                  const tgtGeo = GEO_COORDS[op.targetCountryId];
                  if (srcGeo && tgtGeo) {
                    return (
                      <g key={op.id}>
                        <line
                          x1={srcGeo.cx}
                          y1={srcGeo.cy}
                          x2={tgtGeo.cx}
                          y2={tgtGeo.cy}
                          stroke="#00e5ff"
                          strokeWidth="1.5"
                          strokeDasharray="5 5"
                        />
                        <circle cx={tgtGeo.cx} cy={tgtGeo.cy} r="4" fill="none" stroke="#00e5ff" strokeWidth="1" className="animate-ping" />
                      </g>
                    );
                  }
                  return null;
                });
              }
              return null;
            })}
          </g>
        )}

        {/* MISSILES / STRIKES arcs drawing */}
        <g>
          {activeStrikes.map((strike) => {
            if (strike.status !== 'IN_FLIGHT') return null;

            const progressDecimal = strike.progressPct / 100;
            const pt = getBezierPoint(strike.bezier, progressDecimal);

            const isNuke = !!strike.warheadYieldMT;
            const strokeColor = isNuke ? 'var(--color-red)' : 'var(--color-amber)';
            const glowFilter = isNuke ? 'url(#neon-glow-amber)' : 'url(#neon-glow-green)';

            return (
              <g key={strike.id}>
                {/* Visual Trajectory Vector Line Arc */}
                <path
                  d={`M ${strike.bezier.startX},${strike.bezier.startY} Q ${strike.bezier.controlX},${strike.bezier.controlY} ${strike.bezier.endX},${strike.bezier.endY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="1"
                  strokeDasharray="5 3"
                  strokeDashoffset={-currentTick * 2}
                  className="transition-all"
                  style={{ animation: 'dash-march 0.5s linear infinite' }}
                />

                {/* Flying projectile tip dot indicator */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill={isNuke ? '#ff2244' : '#ffb300'}
                  className="animate-pulse"
                />

                {/* Sub-label for telemetry warning */}
                <text
                  x={pt.x + 8}
                  y={pt.y - 4}
                  fill={isNuke ? '#ff2244' : '#ffb300'}
                  fontSize="6.5"
                  fontFamily="monospace"
                >
                  {strike.weaponType} ({Math.round(strike.progressPct)}%)
                </text>
              </g>
            );
          })}
        </g>

        {/* Expanding nuclear impact blast flashings */}
        <g>
          {activeStrikes
            .filter((s) => s.status === 'IMPACT')
            .map((strike) => {
              const tgtGeo = GEO_COORDS[strike.targetCountryId];
              if (!tgtGeo) return null;

              const isNuke = !!strike.warheadYieldMT;

              return (
                <g key={`impact-flash-${strike.id}`}>
                  {/* Expanding explosion ring */}
                  <circle
                    cx={tgtGeo.cx}
                    cy={tgtGeo.cy}
                    r="40"
                    fill="none"
                    stroke={isNuke ? '#ff2244' : '#ffb300'}
                    strokeWidth="3"
                    className="origin-center animate-[ping_1.5s_infinite]"
                    style={{ transformOrigin: `${tgtGeo.cx}px ${tgtGeo.cy}px` }}
                  />
                  <circle
                    cx={tgtGeo.cx}
                    cy={tgtGeo.cy}
                    r="8"
                    fill={isNuke ? 'rgba(255, 34, 68, 0.85)' : 'rgba(255, 179, 0, 0.85)'}
                    className="animate-ping"
                  />
                </g>
              );
            })}
        </g>
      </svg>
    </div>
  );
}
