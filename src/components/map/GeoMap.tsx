import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, ArcLayer, IconLayer, LineLayer } from '@deck.gl/layers';

// Zustand stores
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { useCanonicalMapState } from './mapSelectors';
import { useUnitStore } from '../../store/unitStore';
import { SEEDED_HOTSPOTS } from '../../data/hotspots';

// Types and helper files
import { LayerKey, LayerToggleState } from './mapTypes';
import { CarrierGroupUnit } from '../../types';
import { getCentroid } from './countryCentroids';
import { audio } from '../../utils/audio';
import { MapCoordinateReadout } from './MapCoordinateReadout';
import MapLayerPanel from './MapLayerPanel';
import MapModeToggle from './MapModeToggle';
import { InGameGlobe } from './InGameGlobe';

// CARTO Dark Matter raster base tiles style
export const DARK_BASEMAP_STYLE = {
  version: 8 as const,
  sources: {
    'carto-dark': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster' as const,
      source: 'carto-dark',
      paint: {
        'raster-saturation': -0.7,
        'raster-hue-rotate': 190,
        'raster-contrast': 0.15,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.7,
      }
    }
  ]
};

// Simple visual SVGs URL-encoded to feed directly into deck.gl's IconLayer
const MILITARY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="%23f5a623" stroke="%23ffebc2" stroke-width="2"><polygon points="12,2 22,12 12,22 2,12" /></svg>`;
const MILITARY_ICON_DATA = `data:image/svg+xml;utf8,${encodeURIComponent(MILITARY_SVG)}`;

const CYBER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="%23b87fff" stroke-width="2"><polygon points="12,2 22,8 22,16 12,22 2,16 2,8" /></svg>`;
const CYBER_ICON_DATA = `data:image/svg+xml;utf8,${encodeURIComponent(CYBER_SVG)}`;

interface GeoMapProps {
  mode: '2d' | '3d';
  layers: LayerToggleState;
  theme?: 'dark' | 'light';
}

export function GeoMap({ mode: initialMode, layers: initialLayers, theme = 'dark' }: GeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckRef = useRef<Deck | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'2d' | '3d'>(initialMode);
  const [localLayers, setLocalLayers] = useState<LayerToggleState>({
    political: true,
    military: true,
    conflicts: true,
    economic: false,
    nuclear: true,
    cyber: false,
    population: false,
    propaganda: true,
    ...initialLayers,
  });

  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [animationTick, setAnimationTick] = useState(0);
  const [mapZoom, setMapZoom] = useState(1.8);

  // Synchronized stores variables
  const countries = useWorldStore((s) => s.countries);
  const worldBuilderConfig = useWorldStore((s) => s.worldBuilderConfig) || {};
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const units = useUnitStore((s) => s.units);
  const selectedUnitId = useUnitStore((s) => s.selectedUnitId);
  const selectedHotspotId = useUIStore((s) => s.selectedHotspotId);
  const inspectedCountryId = useUIStore((s) => s.countryInspectorId);

  const builderSelectedIds = useUIStore((s) => s.builderSelectedIds) || [];
  const builderMapMode = useUIStore((s) => s.builderMapMode) || 'ALLIANCE';
  const multiSelectMode = useUIStore((s) => s.multiSelectMode) || false;
  
  // Use map canonical selectors
  const mapState = useCanonicalMapState(localLayers, theme);
  const playerCountryId = mapState.playerCountryId;
  const targetCountryId = mapState.targetCountryId;

  // Track ticker and animation loops for pulsing overlay circles
  useEffect(() => {
    let frameId: number;
    const updateAnimations = () => {
      setAnimationTick((prev) => prev + 1);
      frameId = requestAnimationFrame(updateAnimations);
    };
    frameId = requestAnimationFrame(updateAnimations);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Update layout when mode prop updates
  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  // MapLibre and Deck.gl Initialization Cycle
  useEffect(() => {
    if (activeMode !== '2d' || !mapContainerRef.current) return;

    setIsLoading(true);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_BASEMAP_STYLE,
      center: [20, 28],
      zoom: 1.8,
      minZoom: 1.1,
      maxZoom: 7,
      attributionControl: false,
    });

    // Gracefully handle basemap tile fetch errors or network disconnects
    map.on('error', (e) => {
      console.warn('[GEOMAP] MapLibre asset or tile load failure caught gracefully:', e.error || e.message || e);
    });

    mapRef.current = map;

    map.on('load', () => {
      const deck = new Deck({
        canvas: 'deck-canvas',
        width: '100%',
        height: '100%',
        initialViewState: {
          longitude: 20,
          latitude: 28,
          zoom: 1.8,
        } as any,
        controller: true,
        onViewStateChange: ({ viewState }: any) => {
          setMapZoom(viewState.zoom);
          map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing ?? 0,
            pitch: viewState.pitch ?? 0,
          });
        },
        layers: [],
      });

      deckRef.current = deck;
      setIsLoading(false);

      // MapLibre input interaction camera events updates deck.gl state
      map.on('move', () => {
        const center = map.getCenter();
        const currentZoom = map.getZoom();
        setMapZoom(currentZoom);
        deck.setProps({
          viewState: {
            longitude: center.lng,
            latitude: center.lat,
            zoom: currentZoom,
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          } as any
        });
      });
    });

    return () => {
      deckRef.current?.finalize();
      mapRef.current?.remove();
      deckRef.current = null;
      mapRef.current = null;
    };
  }, [activeMode]);

  // Synchronize dynamic Deck overlays in real-time
  useEffect(() => {
    if (activeMode !== '2d' || !deckRef.current) return;

    const activeDeckLayers: any[] = [];

    // --- Interactive overlay handler helper ---
    const handleItemClick = (info: any, event: any) => {
      if (info.object) {
        if (info.object.isHotspot && info.object.id) {
          useLinkedAnalysisStore.getState().selectCountry(info.object.countryId);
          useUIStore.getState().setSelectedHotspot(info.object.id, info.object.countryId);
          audio.sfxKeyClick();
        } else if (info.object.id) {
          const isShift = event?.srcEvent?.shiftKey || false;
          const isMultiSelect = useUIStore.getState().multiSelectMode;
          const setInspector = useUIStore.getState().setCountryInspector;
          
          if (setInspector) {
            if (isMultiSelect || isShift) {
              useUIStore.getState().toggleBuilderSelectedId(info.object.id);
            } else {
              useLinkedAnalysisStore.getState().selectCountry(info.object.id);
              setInspector(info.object.id);
              useUIStore.getState().setSelectedHotspot(null);
            }
          } else {
            useLinkedAnalysisStore.getState().selectCountry(info.object.id);
            useUIStore.getState().setSelectedHotspot(null);
          }
          audio.sfxKeyClick();
        }
      }
    };

    // --- 1. POLITICAL INTEL LAYER ---
    if (localLayers.political) {
      const politicalPoints = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const isPlayer = id === playerCountryId;
        const isTarget = id === targetCountryId;
        return {
          id,
          name: country.name || id,
          coordinates: centroid,
          isPlayer,
          isTarget,
          allianceBlock: country.allianceBlock || 'NEUTRAL',
        };
      }).filter(d => d.coordinates[0] !== 0 || d.coordinates[1] !== 0);

      activeDeckLayers.push(
        new ScatterplotLayer({
          id: 'political-centroids',
          data: politicalPoints,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => {
            const countryId = d.id;
            const isMultiSelected = builderSelectedIds.includes(countryId);
            if (countryId === inspectedCountryId) return 300000;
            if (isMultiSelected) return 240000;
            if (d.isPlayer) return 180000;
            if (d.isTarget) return 150000;
            return 90000;
          },
          getFillColor: (d: any) => {
            const countryId = d.id;
            const custom = worldBuilderConfig[countryId];
            const isMultiSelected = builderSelectedIds.includes(countryId);
            const isInspected = countryId === inspectedCountryId;
            
            if (isInspected) {
              return [0, 255, 68, 250]; // Bright highlight green for edited/inspected country in builder
            }

            const ideology = custom ? custom.ideology : (countries[countryId]?.political?.ideology || 'DEMOCRACY');
            const alliance = custom ? custom.alliance : (countries[countryId]?.allianceBlock || 'NEUTRAL');
            const nuclear = custom ? custom.nuclear : (countries[countryId]?.arsenal?.nuclearCapable || false);
            const military = custom ? custom.military : (countries[countryId]?.arsenal?.totalPowerRating ?? 50);
            const gdp = custom ? custom.gdp : (countries[countryId]?.economic?.gdpB ?? 100);
            const opinion = custom ? custom.opinion : (countries[countryId]?.opinions?.[playerCountryId] ?? 0);

            const alpha = isMultiSelected ? 255 : 190;

            switch (builderMapMode) {
              case 'IDEOLOGY': {
                switch (ideology) {
                  case 'DEMOCRACY': return [59, 130, 246, alpha]; // Royal Blue
                  case 'COMMUNISM': return [244, 63, 94, alpha]; // Rose
                  case 'AUTOCRACY': return [239, 68, 68, alpha]; // Red
                  case 'MILITARY_JUNTA': return [245, 158, 11, alpha]; // Amber
                  case 'THEOCRACY': return [168, 85, 247, alpha]; // Purple
                  case 'TECHNOCRACY': return [6, 182, 212, alpha]; // Cyan
                  case 'OLIGARCHY': return [234, 179, 8, alpha]; // Yellow
                  case 'MONARCHY': return [217, 119, 6, alpha]; // Orange-brown
                  default: return [148, 163, 184, alpha];
                }
              }
              case 'NUCLEAR': {
                if (nuclear) {
                  return [234, 179, 8, isMultiSelected ? 255 : 230]; // Radioactive glowing gold
                }
                return [51, 65, 85, 95]; // Faded cool slate
              }
              case 'MILITARY': {
                if (military < 35) return [148, 163, 184, isMultiSelected ? 180 : 100];
                if (military < 60) return [245, 158, 11, alpha];
                if (military < 85) return [249, 115, 22, alpha];
                return [239, 68, 68, alpha];
              }
              case 'GDP': {
                if (gdp < 250) return [148, 163, 184, isMultiSelected ? 180 : 100];
                if (gdp < 1500) return [110, 231, 183, alpha];
                if (gdp < 6000) return [16, 185, 129, alpha];
                return [4, 120, 87, alpha];
              }
              case 'OPINION': {
                if (countryId === playerCountryId) return [0, 229, 255, alpha]; // Cyan
                if (opinion < -50) return [239, 68, 68, alpha];
                if (opinion < -10) return [251, 146, 60, alpha];
                if (opinion < 10) return [148, 163, 184, 120];
                if (opinion < 50) return [45, 212, 191, alpha];
                return [34, 197, 94, alpha];
              }
              case 'ALLIANCE':
              default: {
                switch (alliance) {
                  case 'NATO': return [59, 130, 246, alpha];
                  case 'BRICS': return [249, 115, 22, alpha];
                  case 'GCC': return [234, 179, 8, alpha];
                  case 'QUAD': return [20, 184, 166, alpha];
                  case 'SCO': return [168, 85, 247, alpha];
                  case 'NEUTRAL':
                  default:
                    return [148, 163, 184, isMultiSelected ? 180 : 100];
                }
              }
            }
          },
          getLineColor: (d: any) => {
            const countryId = d.id;
            const isMultiSelected = builderSelectedIds.includes(countryId);
            if (countryId === inspectedCountryId) return [255, 255, 255, 255];
            if (isMultiSelected) return [255, 0, 150, 255]; // Vivid hot-pink ring for multi-select
            return d.isPlayer ? [0, 255, 170, 255] : [0, 229, 200, 180];
          },
          lineWidthMinPixels: 1.5,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
          updateTriggers: {
            getFillColor: [playerCountryId, targetCountryId, inspectedCountryId, countries, worldBuilderConfig, builderMapMode, builderSelectedIds],
            getRadius: [playerCountryId, targetCountryId, inspectedCountryId, countries, builderSelectedIds],
            getLineColor: [inspectedCountryId, builderSelectedIds, playerCountryId]
          }
        })
      );
    }

    // --- 2. MILITARY LAYER ---
    if (localLayers.military) {
      const militaryNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const powerRating = country.arsenal?.totalPowerRating ?? 0;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          powerRating,
        };
      }).filter(d => d.coordinates[0] !== 0 && d.powerRating > 30);

      activeDeckLayers.push(
        new IconLayer({
          id: 'military-assets',
          data: militaryNodes,
          getIcon: () => ({
            url: MILITARY_ICON_DATA,
            width: 24,
            height: 24,
            mask: false,
          }),
          getPosition: (d: any) => d.coordinates,
          getSize: (d: any) => Math.min(22, Math.max(12, d.powerRating * 0.05)),
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- 3. CONFLICTS LAYER ---
    if (localLayers.conflicts) {
      const conflictNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const hasWar = country.atWarWith && country.atWarWith.length > 0;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          hasWar,
        };
      }).filter(d => d.coordinates[0] !== 0 && d.hasWar);

      const pulseFactor = 1 + 0.35 * Math.sin(animationTick * 0.08);

      activeDeckLayers.push(
        new ScatterplotLayer({
          id: 'conflict-pulse-outer',
          data: conflictNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: () => 160000 * pulseFactor,
          getFillColor: [255, 59, 78, 35],
          getLineColor: [255, 59, 78, 225],
          lineWidthMinPixels: 1.5,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
        }),
        new ScatterplotLayer({
          id: 'conflict-pulse-inner',
          data: conflictNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: 70000,
          getFillColor: [255, 59, 78, 255],
          stroked: false,
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- 4. ECONOMIC LAYER ---
    if (localLayers.economic) {
      const economicNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const gdp = country.economic?.gdpB ?? 0;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          gdp,
        };
      }).filter(d => d.coordinates[0] !== 0 && d.gdp > 10);

      activeDeckLayers.push(
        new ScatterplotLayer({
          id: 'economic-markers',
          data: economicNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => Math.min(300000, Math.max(55000, d.gdp * 45)),
          getFillColor: [57, 217, 138, 110],
          getLineColor: [57, 217, 138, 230],
          lineWidthMinPixels: 1,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- 5. NUCLEAR LAYER ---
    if (localLayers.nuclear) {
      const nuclearNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const isCapable = country.arsenal?.nuclearCapable ?? false;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          isCapable,
        };
      }).filter(d => d.coordinates[0] !== 0 && d.isCapable);

      activeDeckLayers.push(
        new ScatterplotLayer({
          id: 'nuclear-warning-rings',
          data: nuclearNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: 280000,
          getFillColor: [0, 207, 255, 25],
          getLineColor: [0, 207, 255, 220],
          lineWidthMinPixels: 1.8,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- 6. CYBER LAYER ---
    if (localLayers.cyber) {
      const cyberNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const level = country.intelligence?.cyberFirewallLevel ?? 1;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          level,
        };
      }).filter(d => d.coordinates[0] !== 0);

      activeDeckLayers.push(
        new IconLayer({
          id: 'cyber-intercept-points',
          data: cyberNodes,
          getIcon: () => ({
            url: CYBER_ICON_DATA,
            width: 24,
            height: 24,
            mask: false,
          }),
          getPosition: (d: any) => d.coordinates,
          getSize: (d: any) => 15 + d.level * 2,
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- 7. POPULATION LAYER ---
    if (localLayers.population) {
      const populationNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const popM = country.demographic?.populationM ?? 5;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          popM,
        };
      }).filter(d => d.coordinates[0] !== 0);

      activeDeckLayers.push(
        new ScatterplotLayer({
          id: 'population-density',
          data: populationNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => Math.min(420000, Math.max(65000, d.popM * 520)),
          getFillColor: [126, 231, 135, 80],
          stroked: false,
          pickable: true,
          onClick: handleItemClick,
        })
      );
    }

    // --- PROPAGANDA NARRATIVE WARFARE LAYER ---
    if (localLayers.propaganda) {
      const propagandaNodes = Object.entries(countries).map(([id, country]: [string, any]) => {
        const centroid = getCentroid(id);
        const narrative = country.domesticNarrative !== undefined ? country.domesticNarrative : (country.political?.ideology === 'DEMOCRACY' ? 55 : 75);
        const delta = country.recentNarrativeDelta || 0;
        return {
          id,
          name: country.name,
          coordinates: centroid,
          narrative,
          delta,
        };
      }).filter(d => d.coordinates[0] !== 0 || d.coordinates[1] !== 0);

      // Pulse multiplier for auras
      const pressurePulse = 1 + 0.3 * Math.sin(animationTick * 0.08);

      activeDeckLayers.push(
        // Layer A: Outer pressure aura (opacity is tied directly to narrative delta)
        new ScatterplotLayer({
          id: 'propaganda-pressure-auras',
          data: propagandaNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: (d: any) => {
            const base = 250000;
            // Expand slightly under active campaign pressure
            const multiplier = d.delta !== 0 ? pressurePulse : 1;
            return base * multiplier;
          },
          getFillColor: (d: any) => {
            const absDelta = Math.abs(d.delta);
            // Opacity is tied to narrative delta: stronger pressure = more visible, zero pressure = faint (opacity 5)
            const alpha = Math.min(220, Math.max(5, Math.round(absDelta * 240)));
            
            if (d.delta < 0) {
              return [255, 34, 68, alpha]; // Red core for hostile/destabilizing pressure
            } else if (d.delta > 0) {
              return [0, 255, 170, alpha]; // Cyan for stabilizing/positive pressure
            } else {
              return [148, 163, 184, 5]; // extremely faint default if zero pressure
            }
          },
          getLineColor: (d: any) => {
            const absDelta = Math.abs(d.delta);
            const alpha = Math.min(255, Math.max(0, Math.round(absDelta * 255)));
            return d.delta < 0 ? [255, 59, 78, alpha] : [0, 255, 200, alpha];
          },
          lineWidthMinPixels: 1.5,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
          updateTriggers: {
            getFillColor: [countries, animationTick],
            getLineColor: [countries, animationTick],
            getRadius: [animationTick]
          }
        }),

        // Layer B: Core domestic narrative health status dot
        new ScatterplotLayer({
          id: 'propaganda-narrative-cores',
          data: propagandaNodes,
          getPosition: (d: any) => d.coordinates,
          getRadius: () => 90000,
          getFillColor: (d: any) => {
            const val = d.narrative;
            // Standard red -> yellow -> green/cyan gradient based on narrative alignment
            if (val < 25) {
              return [239, 68, 68, 220]; // Danger Red (unrest risk)
            } else if (val < 50) {
              return [245, 158, 11, 220]; // Warning Yellow
            } else if (val < 75) {
              return [0, 215, 255, 220]; // Info Cyan
            } else {
              return [34, 197, 94, 220]; // High compliance Emerald Green
            }
          },
          getLineColor: [255, 255, 255, 80],
          lineWidthMinPixels: 1,
          stroked: true,
          pickable: true,
          onClick: handleItemClick,
          updateTriggers: {
            getFillColor: [countries]
          }
        })
      );
    }

    // --- STRIKE ARCS BASELINE ---
    const liveStrikes = activeStrikes.filter((s: any) => s.status === 'IN_FLIGHT' || s.progressPct < 100);

    activeDeckLayers.push(
      new ArcLayer({
        id: 'strike-arcs',
        data: liveStrikes,
        getSourcePosition: (d: any) => getCentroid(d.sourceCountryId),
        getTargetPosition: (d: any) => getCentroid(d.targetCountryId),
        getSourceColor: [255, 59, 78, 225],
        getTargetColor: [255, 59, 78, 65],
        getWidth: 3,
        greatCircle: true,
        pickable: true,
      })
    );

    // --- TACTICAL CARRIER WAKE TRAILS ---
    const wakeSegments: any[] = [];
    units.forEach((u) => {
      if (u.type === 'CarrierGroup') {
        const cg = u as CarrierGroupUnit;
        if (cg.wakeTrail && cg.wakeTrail.length > 1) {
          for (let i = 0; i < cg.wakeTrail.length - 1; i++) {
            wakeSegments.push({
              source: cg.wakeTrail[i],
              target: cg.wakeTrail[i + 1],
              agePct: (i + 1) / cg.wakeTrail.length,
              owner: u.owner
            });
          }
        }
      }
    });

    if (wakeSegments.length > 0) {
      activeDeckLayers.push(
        new LineLayer({
          id: 'tactical-carrier-wakes',
          data: wakeSegments,
          getSourcePosition: (d: any) => d.source,
          getTargetPosition: (d: any) => d.target,
          getColor: (d: any) => d.owner === playerCountryId ? [0, 191, 255, Math.round(d.agePct * 160)] : [100, 116, 139, Math.round(d.agePct * 80)],
          getWidth: 2.5,
          pickable: false,
        })
      );
    }

    // --- MOVING CARRIERS / UNITS TRANSIT PATHS ---
    const activeRoutes = units.filter((u) => u.status === 'MOVING' && u.route);
    activeDeckLayers.push(
      new ArcLayer({
        id: 'tactical-unit-routes',
        data: activeRoutes,
        getSourcePosition: (d: any) => [d.route!.source.lon, d.route!.source.lat],
        getTargetPosition: (d: any) => [d.route!.destination.lon, d.route!.destination.lat],
        getSourceColor: (d: any) => d.owner === playerCountryId ? [0, 255, 230, 200] : [148, 163, 184, 100],
        getTargetColor: (d: any) => d.owner === playerCountryId ? [0, 191, 255, 100] : [148, 163, 184, 50],
        getWidth: 1.8,
        greatCircle: true,
        pickable: false,
      })
    );

    // --- TACTICAL UNITS SCALE AND POSITION MARKERS ---
    activeDeckLayers.push(
      new ScatterplotLayer({
        id: 'tactical-units',
        data: units,
        getPosition: (d: any) => [d.position.lon, d.position.lat],
        getRadius: (d: any) => {
          let base = d.type === 'CarrierGroup' ? 140000 : d.type === 'Submarine' ? 90000 : d.type === 'ICBMSilo' ? 100000 : d.type === 'AirWing' ? 80000 : 70000;
          if (d.id === selectedUnitId) base *= 1.4;
          return base;
        },
        getFillColor: (d: any) => {
          // If stealth submarine not owned, render very low detection trace
          if (d.type === 'Submarine' && d.owner !== playerCountryId) {
            return [168, 85, 247, 15]; // low opacity purple
          }

          switch (d.type) {
            case 'CarrierGroup': return [0, 191, 255, 255];  // Cyber cyan
            case 'Submarine': return [168, 85, 247, 245];     // Violet
            case 'ICBMSilo': return [239, 68, 68, 255];       // Nuclear red
            case 'AirWing': return [245, 158, 11, 255];       // Tactical amber
            case 'SpecForce': return [34, 197, 94, 255];      // Operative emerald green
            default: return [255, 255, 255, 200];
          }
        },
        getLineColor: (d: any) => d.id === selectedUnitId ? [255, 255, 255, 255] : [0, 0, 0, 180],
        getLineWidth: 22000,
        stroked: true,
        pickable: true,
        onClick: (info: any) => {
          if (info.object) {
            useUnitStore.getState().selectUnit(info.object.id);
            audio.sfxKeyClick();
          }
        }
      })
    );

    // --- T4.5 GEOGRAPHIC INTEL HOTSPOTS LAYER ---
    // Section 10: Zoom-aware density filtering to prevent overlap
    const filteredHotspots = SEEDED_HOTSPOTS.filter((hotspot) => {
      // Always show selected hotspot!
      if (selectedHotspotId === hotspot.id) return true;
      
      // Filter based on map zoom levels
      if (mapZoom < 2.2) {
        // Zoomed out maximum: show major global hubs only (importance >= 4)
        return hotspot.importance >= 4;
      } else if (mapZoom < 3.5) {
        // Medium zoom: show strategic level ports & complexes (importance >= 3)
        return hotspot.importance >= 3;
      }
      // Zoomed in: show all directory nodes
      return true;
    });

    const hotspotPoints = filteredHotspots.map((hotspot) => {
      const isSelected = selectedHotspotId === hotspot.id;
      let rgbColor = [144, 164, 174]; // blue grey
      if (hotspot.type === 'NAVAL_BASE') rgbColor = [0, 176, 255];
      else if (hotspot.type === 'AIR_BASE') rgbColor = [0, 229, 255];
      else if (hotspot.type === 'NUCLEAR_FACILITY') rgbColor = [255, 42, 74];
      else if (hotspot.type === 'MISSILE_SITE') rgbColor = [255, 161, 0];
      else if (hotspot.type === 'DIPLOMATIC_COMPOUND') rgbColor = [255, 234, 0];
      else if (hotspot.type === 'COVERT_SITE') rgbColor = [213, 0, 249];
      else if (hotspot.type === 'CYBER_FACILITY') rgbColor = [0, 230, 118];
      else if (hotspot.type === 'INDUSTRIAL_SITE') rgbColor = [176, 190, 197];

      return {
        id: hotspot.id,
        countryId: hotspot.countryId,
        name: hotspot.name,
        coordinates: [hotspot.lon, hotspot.lat],
        isHotspot: true,
        isSelected,
        color: rgbColor,
        importance: hotspot.importance
      };
    });

    activeDeckLayers.push(
      new ScatterplotLayer({
        id: 'country-hotspots-outer',
        data: hotspotPoints,
        getPosition: (d: any) => d.coordinates,
        // Make radius size responsive to map zoom to avoid clumping
        getRadius: (d: any) => d.isSelected ? (240000 / (mapZoom * 0.45)) : ((d.importance >= 4 ? 130000 : 90000) / (mapZoom * 0.45)),
        getFillColor: (d: any) => [...d.color, d.isSelected ? 85 : 25] as any,
        getLineColor: (d: any) => [...d.color, d.isSelected ? 255 : 45] as any,
        lineWidthMinPixels: 1.5,
        stroked: true,
        pickable: true,
        onClick: handleItemClick,
        updateTriggers: {
          getRadius: [selectedHotspotId, mapZoom],
          getFillColor: [selectedHotspotId, mapZoom],
          getLineColor: [selectedHotspotId, mapZoom]
        }
      }),
      new ScatterplotLayer({
        id: 'country-hotspots-core',
        data: hotspotPoints,
        getPosition: (d: any) => d.coordinates,
        getRadius: (d: any) => (d.isSelected ? 110000 : 65000) / (mapZoom * 0.45),
        getFillColor: (d: any) => [...d.color, d.isSelected ? 255 : 210] as any,
        getLineColor: [0, 0, 0, 185],
        lineWidthMinPixels: 1,
        stroked: true,
        pickable: true,
        onClick: handleItemClick,
        updateTriggers: {
          getRadius: [selectedHotspotId, mapZoom],
          getFillColor: [selectedHotspotId, mapZoom]
        }
      })
    );

    deckRef.current.setProps({ layers: activeDeckLayers });
  }, [activeMode, countries, activeStrikes, localLayers, playerCountryId, targetCountryId, animationTick, units, selectedUnitId, selectedHotspotId, mapZoom]);

  const handleToggleLayer = (key: LayerKey) => {
    setLocalLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAllLayers = () => {
    setLocalLayers({
      political: true,
      military: true,
      conflicts: true,
      economic: true,
      nuclear: true,
      cyber: true,
      population: true,
      propaganda: true,
    });
  };

  const handleClearLayers = () => {
    setLocalLayers({
      political: false,
      military: false,
      conflicts: false,
      economic: false,
      nuclear: false,
      cyber: false,
      population: false,
      propaganda: false,
    });
  };

  if (activeMode === '3d') {
    return (
      <div className="absolute inset-0 w-full h-full relative overflow-hidden bg-slate-950">
        {/* Render 3D Earth Globe with the shared state */}
        <InGameGlobe theme={theme} layers={localLayers} />

        {/* Tactical Layer Toggle Panels and map widgets floating on core 3D scene */}
        <MapLayerPanel
          layers={localLayers}
          onToggle={handleToggleLayer}
          onAll={handleAllLayers}
          onClear={handleClearLayers}
          theme={theme}
          isOpen={isLayerPanelOpen}
          onToggleOpen={() => setIsLayerPanelOpen(prev => !prev)}
        />

        <MapModeToggle mode={activeMode} onToggle={(m) => setActiveMode(m)} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950" id="geo-map-frame" style={{ position: 'relative' }}>
      
      {/* HUD Radar Pulse effect */}
      <div className="absolute inset-0 pointer-events-none z-[10] border border-cyan-800/10 bg-[radial-gradient(ellipse_at_top,rgba(0,229,200,0.012)_0%,rgba(0,0,0,0)_100%)] select-none mix-blend-screen animate-pulse" />

      {/* Sensor establishment loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col justify-center items-center font-mono gap-3 select-none bg-slate-950/92">
          <div className="w-10 h-10 border-2 rounded-full animate-spin border-cyan-500/10 border-t-cyan-400" />
          <span className="text-[10px] font-bold tracking-widest animate-pulse uppercase text-cyan-400 font-sans">
            ESTABLISHING ORBITAL SENSOR FEED...
          </span>
        </div>
      )}

      {/* MapLibre Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ position: 'absolute' }} />

      {/* Passive high-perf deck.gl overlay canvas */}
      <canvas
        id="deck-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 20
        }}
      />

      {/* Coordinates status readouts */}
      <MapCoordinateReadout map={mapRef.current} theme={theme} />

      {/* Floating Panel Widgets */}
      <MapLayerPanel
        layers={localLayers}
        onToggle={handleToggleLayer}
        onAll={handleAllLayers}
        onClear={handleClearLayers}
        theme={theme}
        isOpen={isLayerPanelOpen}
        onToggleOpen={() => setIsLayerPanelOpen(prev => !prev)}
      />

      {/* 2D Flat vs 3D Globe Projection Select */}
      <MapModeToggle mode={activeMode} onToggle={(m) => setActiveMode(m)} />
    </div>
  );
}

export default GeoMap;
