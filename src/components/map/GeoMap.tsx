import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Deck } from '@deck.gl/core';
import * as topojson from 'topojson-client';

import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { LayerKey, LayerToggleState } from './MapLayerPanel';
import { MapCoordinateReadout } from './MapCoordinateReadout';
import { DARK_BASEMAP_STYLE, LIGHT_BASEMAP_STYLE } from './mapStyles';
import { useCanonicalMapState } from './mapSelectors';
import { mapEventPipeline } from './mapEventPipeline';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';

import {
  getNormCountryId,
  buildCountriesLayer,
  buildStrikeArcsLayer,
  buildConflictTetherLayer,
  buildTradeTetherLayer,
  buildDetonationPulseLayer,
  buildMilitaryBasesLayer,
} from './layerBuilders';

interface GeoMapProps {
  mode: '2d' | '3d';
  layers: LayerToggleState;
  theme?: 'dark' | 'light';
}

export function GeoMap({ mode, layers, theme = 'dark' }: GeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckRef = useRef<Deck | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [hoveredCountryName, setHoveredCountryName] = useState<string | null>(null);
  const [lastFeedEvent, setLastFeedEvent] = useState<string | null>(null);

  // Read Canonical Map State Selector (100% mirrors the 3D globe)
  const mapState = useCanonicalMapState(layers, theme);

  // Directly unpack needed synchronized variables to keep complete backward compatibility with layerBuilders
  const countries = useWorldStore((s) => s.countries);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const playerCountryId = mapState.playerCountryId;
  const hudMode = mapState.activeHudMode;
  const targetCountryId = mapState.targetCountryId;
  const activeLayerName = mapState.activeLayer;

  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  // Listen for transient alerts in lockstep with the 3D satellite feed
  useEffect(() => {
    return mapEventPipeline.subscribe((event) => {
      setLastFeedEvent(event.label);
      setTimeout(() => {
        setLastFeedEvent((prev) => (prev === event.label ? null : prev));
      }, event.durationMs);
    });
  }, []);

  // 1. ASYNC GEOJSON BASING
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then((res) => res.json())
      .then((topology) => {
        const converted = topojson.feature(topology, topology.objects.countries as any);
        setGeoJsonData(converted);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[GEOMAP] Failed to retrieve world atlas geojsons:', err);
        setIsLoading(false);
      });
  }, []);

  // 2. INITIALIZE MAPLIBRE + DECK.GL CO-EXISTENCE
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use selected theme style immediately
    const initialStyle = theme === 'dark' ? DARK_BASEMAP_STYLE : LIGHT_BASEMAP_STYLE;

    // Build map instance
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [20, 28],
      zoom: 1.8,
      minZoom: 1.1,
      maxZoom: 7,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Build deck instance linked onto MapLibre camera
      const deck = new Deck({
        canvas: 'deck-canvas',
        width: '100%',
        height: '100%',
        initialViewState: {
          longitude: 20,
          latitude: 28,
          zoom: 1.8,
        },
        controller: true,
        onViewStateChange: ({ viewState }: { viewState: Record<string, unknown> }) => {
          map.jumpTo({
            center: [viewState.longitude as number, viewState.latitude as number],
            zoom: viewState.zoom as number,
            bearing: (viewState.bearing as number) ?? 0,
            pitch: (viewState.pitch as number) ?? 0,
          });
        },
        layers: [],
      });

      deckRef.current = deck;

      // Keep positions and panning locked together
      map.on('move', () => {
        const center = map.getCenter();
        deck.setProps({
          viewState: {
            longitude: center.lng,
            latitude: center.lat,
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
          },
        });
      });
    });

    return () => {
      deckRef.current?.finalize();
      map.remove();
    };
  }, []);

  // 3. REACTIVE STYLE CHANGES
  useEffect(() => {
    if (!mapRef.current) return;
    const nextStyle = theme === 'dark' ? DARK_BASEMAP_STYLE : LIGHT_BASEMAP_STYLE;
    mapRef.current.setStyle(nextStyle);
  }, [theme]);

  // 4. SYNCHRONIZE DYNAMIC DECKS ACCORDING TO STATE EVENTS
  useEffect(() => {
    if (!deckRef.current || !geoJsonData) return;

    const currentDeckLayers: any[] = [];

    // Layer selection context hover & query actions
    const onCountryHover = (info: any) => {
      if (info.object && info.object.properties) {
        const name = info.object.properties.NAME || info.object.properties.name;
        setHoveredCountryName(name || null);
      } else {
        setHoveredCountryName(null);
      }
    };

    const onCountryClicked = (info: any) => {
      if (!info.object) return;
      const id = getNormCountryId(info.object);
      if (id) {
        useLinkedAnalysisStore.getState().selectCountry(id);
      }
    };

    // LAYER A: Sovereign polygons with dynamic layers
    currentDeckLayers.push(
      buildCountriesLayer(
        geoJsonData,
        countries,
        playerCountryId,
        targetCountryId,
        activeLayerName,
        onCountryHover,
        onCountryClicked
      )
    );

    // LAYER B: Discontent heat/dots (custom population simulation)
    if (layers.population) {
      // Handled directly inside countries polygon colors, but can overlay demographic markers here if desired
    }

    // LAYER C: Conflict Meridian lines
    if (layers.conflicts) {
      currentDeckLayers.push(buildConflictTetherLayer(countries));
      currentDeckLayers.push(buildDetonationPulseLayer(activeStrikes));
    }

    // LAYER D: Economic pathways/trade lines
    if (layers.economic) {
      currentDeckLayers.push(buildTradeTetherLayer(countries));
    }

    // LAYER E: Ballistic arc models is always operational for maximum threat focus
    currentDeckLayers.push(buildStrikeArcsLayer(activeStrikes));

    // LAYER F: Military outposts/points
    if (layers.military) {
      currentDeckLayers.push(
        buildMilitaryBasesLayer(countries, playerCountryId, (id) => {
          if (hudMode === 'WAR_ROOM' && id !== playerCountryId) {
            setTargetCountry(id);
          } else {
            setCountryInspector(id);
          }
        })
      );
    }

    // Apply layers to DeckGL instance
    deckRef.current.setProps({ layers: currentDeckLayers });
  }, [geoJsonData, countries, activeStrikes, layers, playerCountryId, targetCountryId, hudMode, activeLayerName]);

  const isDark = theme === 'dark';

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden transition-colors duration-200 ${isDark ? 'bg-slate-950' : 'bg-zinc-55'}`} id="geo-map-frame">
      {/* Radar Sweep Scanning Matrix Overlay (only visible on dark operational screen) */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none z-[10] border border-cyan-800/10 bg-[radial-gradient(ellipse_at_top,rgba(0,229,200,0.015)_0%,rgba(0,0,0,0)_100%)] select-none mix-blend-screen animate-pulse" />
      )}

      {/* Synchronized Transient Alert Banner */}
      {lastFeedEvent && (
        <div
          id="transient-tactical-alert"
          className={`absolute top-16 right-4 z-[115] px-4 py-2 border backdrop-blur-md rounded-[1px] font-mono text-[9px] font-bold tracking-wider animate-pulse transition-all shadow-lg
            ${isDark
              ? 'bg-red-950/95 border-red-500/80 text-red-450 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
              : 'bg-red-50/95 border-red-300 text-red-900'
            }
          `}
        >
          ⚠️ SCAN ALERT: {lastFeedEvent}
        </div>
      )}

      {/* Cyber scanning loading overlay */}
      {isLoading && (
        <div className={`absolute inset-0 z-50 flex flex-col justify-center items-center font-mono gap-3 select-none
          ${isDark ? 'bg-slate-950/90' : 'bg-zinc-100/90'}
        `}>
          <div className={`w-12 h-12 border-2 rounded-full animate-spin
            ${isDark ? 'border-cyan-500/20 border-t-cyan-400' : 'border-cyan-400/20 border-t-cyan-600'}
          `} />
          <span className={`text-[10px] font-bold tracking-widest animate-pulse uppercase
            ${isDark ? 'text-cyan-400' : 'text-cyan-800'}
          `}>
            ESTABLISHING ORBITAL SENSOR FEED...
          </span>
        </div>
      )}

      {/* MapLibre container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Deck.gl overlay canvas */}
      <canvas
        id="deck-canvas"
        className={`absolute inset-0 w-full h-full pointer-events-none ${isDark ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Hover Country Tooltip readout */}
      {hoveredCountryName && (
        <div className={`absolute top-4 left-4 z-[110] px-3 py-1.5 border backdrop-blur-md rounded-[1px] font-display text-[10px] font-extrabold tracking-wider pointer-events-none uppercase transition-colors duration-200
          ${isDark
            ? 'bg-slate-950/90 border-cyan-950/80 text-cyan-300'
            : 'bg-zinc-100/95 border-zinc-300 text-zinc-800 shadow-md'
          }
        `}>
          RADAR LOCK: {hoveredCountryName}
        </div>
      )}

      {/* Coordinate status bar */}
      <MapCoordinateReadout map={mapRef.current} theme={theme} />
    </div>
  );
}
export default GeoMap;
