import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  Zap, 
  Cpu, 
  Globe, 
  Terminal, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Lock, 
  Eye, 
  Sliders, 
  Check, 
  HelpCircle, 
  Compass, 
  Radar, 
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  FastForward,
  AlertTriangle
} from 'lucide-react';
import { audio } from '../../utils/audio';

/* ==========================================================================
   TYPOGRAPHY & STATUS MAPS
   ========================================================================== */

export type SeverityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'SYSTEM' | 'INFO';
export type ProvenanceType = 'OSINT' | 'SIGINT' | 'HUMINT' | 'ESTIMATE' | 'CONFIRMED' | 'CLASSIFIED' | 'INTERNAL' | 'PUBLIC' | 'DISPUTED';

export const SEVERITY_METADATA: Record<SeverityType, {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}> = {
  LOW: {
    label: 'LEVEL_01 / LOW',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
    borderClass: 'border-emerald-900/40',
    dotClass: 'bg-emerald-400',
  },
  MEDIUM: {
    label: 'LEVEL_02 / AMBIENT',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
    borderClass: 'border-[#ffb000]/30',
    dotClass: 'bg-amber-400',
  },
  HIGH: {
    label: 'LEVEL_03 / HIGH_ALT',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-950/25',
    borderClass: 'border-orange-500/35',
    dotClass: 'bg-orange-500',
  },
  CRITICAL: {
    label: 'LEVEL_04 / CRITICAL',
    colorClass: 'text-red-500 font-bold',
    bgClass: 'bg-red-950/30',
    borderClass: 'border-red-500/40',
    dotClass: 'bg-red-500 animate-pulse',
  },
  SYSTEM: {
    label: 'SYS_TRACE / CONTROL',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-950/20',
    borderClass: 'border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  INFO: {
    label: 'OP_DATA / COMM',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/20',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
};

/* ==========================================================================
   1. STRUCTURAL PRIMITIVES
   ========================================================================== */

/**
 * CommandShell
 * High-level frame wrapping the entire workspace.
 */
interface CommandShellProps {
  children: React.ReactNode;
  id?: string;
  bannerNode?: React.ReactNode;
  tickerNode?: React.ReactNode;
}

export function CommandShell({ children, id = 'command-shell', bannerNode, tickerNode }: CommandShellProps) {
  return (
    <div 
      id={id} 
      className="flex flex-col h-screen w-screen bg-[#020502] text-gray-300 font-mono text-[10px] overflow-hidden select-none"
    >
      {/* Alert or Critical Banners */}
      {bannerNode}
      
      {/* Main layout container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {children}
      </div>

      {/* Global Bottom Ticker */}
      {tickerNode}
    </div>
  );
}

/**
 * ControlBar / TopBar
 * Display title, security classification, status
 */
interface ControlBarProps {
  title: string;
  classification?: string;
  statusText?: string;
  children?: React.ReactNode;
}

export function ControlBar({ title, classification = 'TOP SECRET', statusText = 'SYS_LINK: ACTIVE', children }: ControlBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#1a5c1a]/40 bg-[#050f05] px-3 py-2 shrink-0 select-none">
      <div className="flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-[#00ff44] animate-pulse" />
        <span className="text-[10px] font-black tracking-widest text-white uppercase">{title}</span>
        <span className="text-[7.5px] border border-red-500/40 text-red-400 px-1.5 py-0.5 rounded-[1.5px] font-bold bg-red-950/10 uppercase tracking-widest leading-none select-none">
          {classification}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {children}
        <div className="flex items-center gap-1.5">
          <span className="text-[7.5px] text-gray-500 uppercase">{statusText}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-[#00ff44] shadow-[0_0_4px_rgba(0,255,68,0.6)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * SidePanel
 * Outer side layout panel content container
 */
interface SidePanelProps {
  children: React.ReactNode;
  widthClass?: string;
  id?: string;
  isCollapsed?: boolean;
}

export function SidePanel({ children, widthClass = 'w-full md:w-[380px]', id, isCollapsed = false }: SidePanelProps) {
  if (isCollapsed) return null;
  
  return (
    <div 
      id={id} 
      className={`${widthClass} h-full border-r border-[#1a5c1a]/30 bg-[#020502]/80 backdrop-blur-md flex flex-col overflow-hidden shrink-0`}
    >
      {children}
    </div>
  );
}

/**
 * Drawer
 * Slide-in from bottom or side for auxiliary details
 */
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
  sizeClass?: string;
}

export function Drawer({ isOpen, onClose, title, children, position = 'bottom', sizeClass }: DrawerProps) {
  const isBottom = position === 'bottom';
  const defaultSize = isBottom ? 'h-[260px]' : 'w-[320px]';
  const size = sizeClass || defaultSize;

  const animationVariants = {
    closed: isBottom ? { y: '100%' } : { x: '100%' },
    open: isBottom ? { y: 0 } : { x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Backdrop Dismiss Click */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 cursor-pointer" 
            onClick={() => { audio.sfxKeyClick(); onClose(); }}
          />
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={animationVariants}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.25 }}
            className={`fixed ${
              isBottom ? 'bottom-0 left-0 right-0 border-t' : 'top-0 right-0 bottom-0 border-l'
            } border-[#1a5c1a]/55 bg-[#030803] z-50 flex flex-col overflow-hidden shadow-[0_-4px_30px_rgba(0,0,0,0.8)] ${size}`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#050f05] border-b border-[#1a5c1a]/40 select-none">
              <span className="font-bold text-white uppercase tracking-wider">{title}</span>
              <button 
                onClick={() => { audio.sfxKeyClick(); onClose(); }}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Content Scroll Shell */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal / Dialog
 * Overlay popup
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidthClass = 'max-w-md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-[1.5px] cursor-pointer"
            onClick={() => { audio.sfxKeyClick(); onClose(); }}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`relative w-full ${maxWidthClass} bg-[#030703] border border-[#1a5c1a]/60 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden z-10 font-mono text-[10px]`}
          >
            {/* Modal Ribbon */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#051105] border-b border-[#1a5c1a]/50 select-none">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff44] animate-pulse" />
                <span className="font-extrabold text-white uppercase tracking-widest">{title}</span>
              </div>
              <button 
                onClick={() => { audio.sfxKeyClick(); onClose(); }}
                className="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[75vh] scrollbar-thin text-gray-300">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Panel
 * Core surface layout card box with classification strip
 */
interface PanelProps {
  children: React.ReactNode;
  title?: string;
  classification?: string;
  id?: string;
  className?: string;
  severityBorderClass?: string;
  headerActions?: React.ReactNode;
}

export function Panel({ children, title, classification = 'RESTRICTED', id, className = '', severityBorderClass = '', headerActions }: PanelProps) {
  return (
    <div 
      id={id}
      className={`bg-[#030603]/85 border border-[#1a5c1a]/30 rounded-sm flex flex-col overflow-hidden shadow-lg select-none relative ${severityBorderClass} ${className}`}
    >
      {/* Mini classification strip */}
      <div className="h-0.5 bg-[#1a5c1a]/40 w-full" />

      {/* Header bar */}
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#050c05] border-b border-[#1a5c1a]/20">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[9px]">{title}</span>
            <span className="text-[6.5px] text-gray-650 tracking-wider">[{classification}]</span>
          </div>
          {headerActions && (
            <div className="flex items-center gap-1">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Main card body */}
      <div className="flex-1 p-3 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}

/**
 * SectionBlock
 * Inner group block with custom title and header decoration
 */
interface SectionBlockProps {
  title: string;
  children?: React.ReactNode;
  rightNode?: React.ReactNode;
  className?: string;
}

export function SectionBlock({ title, children, rightNode, className = '' }: SectionBlockProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#1a5c1a]/20 pb-1 select-none">
        <span className="text-[8.5px] text-[#00ff44] font-black uppercase tracking-wider">{title}</span>
        {rightNode && <div className="text-[7.5px] text-gray-500 font-mono">{rightNode}</div>}
      </div>
      {children && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * SplitPane
 * Layout splitter container
 */
interface SplitPaneProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function SplitPane({ children, direction = 'horizontal', className = '' }: SplitPaneProps) {
  const flexDir = direction === 'horizontal' ? 'flex-row space-x-3.5' : 'flex-col space-y-3.5';
  return (
    <div className={`flex w-full h-full min-h-0 ${flexDir} ${className}`}>
      {children}
    </div>
  );
}

/**
 * TabGroup
 * Compact group tabs switcher
 */
interface TabGroupProps<T extends string | number> {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function TabGroup<T extends string | number>({ tabs, activeId, onChange, className = '', size = 'xs' }: TabGroupProps<T>) {
  const padClass = size === 'xs' ? 'py-0.5 px-2 text-[7.5px]' : size === 'sm' ? 'py-1 px-3 text-[8.5px]' : 'py-1.5 px-4 text-[9px]';
  return (
    <div className={`grid grid-flow-col auto-cols-max gap-0.5 bg-black/45 p-0.5 border border-[#1a5c1a]/30 rounded-sm select-none ${className}`}>
      {tabs.map((t) => {
        const isActive = activeId === t.id;
        return (
          <button
            key={t.id.toString()}
            type="button"
            onClick={() => { audio.sfxKeyClick(); onChange(t.id); }}
            className={`font-black uppercase tracking-wider cursor-pointer rounded-[1px] transition-all flex items-center justify-center gap-1 ${padClass} ${
              isActive
                ? 'bg-[#153a15] text-[#00ff44] border border-[#00ff44]/55'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.icon && <span className="shrink-0">{t.icon}</span>}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * ScrollRegion
 * Safe wrapping component with customized scroll styling
 */
interface ScrollRegionProps {
  children: React.ReactNode;
  maxHeightClass?: string;
  className?: string;
}

export function ScrollRegion({ children, maxHeightClass = 'max-h-[350px]', className = '' }: ScrollRegionProps) {
  return (
    <div className={`overflow-y-auto pr-1 scrollbar-thin ${maxHeightClass} ${className}`}>
      {children}
    </div>
  );
}

/* ==========================================================================
   2. INFORMATION PRIMITIVES
   ========================================================================== */

/**
 * FactChip
 * Minimal badge describing intelligence class source
 */
interface FactChipProps {
  classType: ProvenanceType;
  className?: string;
}

export function FactChip({ classType, className = '' }: FactChipProps) {
  const colors: Record<ProvenanceType, string> = {
    OSINT: 'border-blue-900/50 text-blue-400 bg-blue-950/10',
    SIGINT: 'border-cyan-900/55 text-cyan-400 bg-cyan-950/15',
    HUMINT: 'border-pink-900/50 text-pink-400 bg-pink-950/10',
    ESTIMATE: 'border-purple-900/50 text-purple-400 bg-purple-950/10',
    CONFIRMED: 'border-emerald-900/60 text-emerald-400 bg-emerald-950/15',
    CLASSIFIED: 'border-red-900/60 text-red-500 bg-red-955/15',
    INTERNAL: 'border-gray-800 text-gray-400 bg-transparent',
    PUBLIC: 'border-[#1a5c1a]/30 text-gray-400 bg-black/20',
    DISPUTED: 'border-orange-950/60 text-orange-400 bg-orange-950/10',
  };

  return (
    <span className={`px-1.5 py-0.5 border text-[7px] font-bold uppercase rounded-[1px] tracking-wider select-none leading-none inline-block ${colors[classType]} ${className}`}>
      {classType}
    </span>
  );
}

/**
 * StatusBadge
 * Diplomatic, Military, Economic statuses
 */
interface StatusBadgeProps {
  label: string;
  statusType?: 'stable' | 'active' | 'strained' | 'violated' | 'expired' | 'offline' | 'critical' | 'alert';
}

export function StatusBadge({ label, statusType = 'stable' }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    stable: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40',
    active: 'bg-[#153a15] text-[#00ff44] border-[#00ff44]/50',
    strained: 'bg-[#1a1202] text-[#ffb000] border-[#ffb000]/30',
    violated: 'bg-orange-950/20 text-orange-400 border-orange-900/40',
    expired: 'bg-zinc-900 text-zinc-500 border-zinc-800',
    offline: 'bg-red-950/10 text-red-400/50 border-red-955/20',
    critical: 'bg-red-955/25 text-red-500 border-red-500/50 animate-pulse',
    alert: 'bg-indigo-950/20 text-indigo-400 border-indigo-900/40',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[7.5px] font-bold uppercase rounded-sm select-none leading-none ${styles[statusType]}`}>
      <span className={`w-1 h-1 rounded-full ${
        statusType === 'stable' || statusType === 'active' ? 'bg-emerald-400' :
        statusType === 'strained' || statusType === 'violated' ? 'bg-amber-400' :
        statusType === 'expired' || statusType === 'offline' ? 'bg-zinc-550' : 'bg-red-500 animate-pulse'
      }`} />
      {label}
    </span>
  );
}

/**
 * SeverityIndicator
 */
interface SeverityIndicatorProps {
  severity: SeverityType;
}

export function SeverityIndicator({ severity }: SeverityIndicatorProps) {
  const meta = SEVERITY_METADATA[severity] || SEVERITY_METADATA.SYSTEM;

  return (
    <div className={`p-1.5 px-2 border rounded ${meta.borderClass} ${meta.bgClass} flex justify-between items-center text-[8px]`}>
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
        <span className={`${meta.colorClass} font-extrabold uppercase tracking-widest`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}

/**
 * ClassificationLabel
 */
export function ClassificationLabel({ level = 'RESTRICTED' }: { level?: string }) {
  return (
    <span className="text-[7.5px] border border-red-500/40 text-red-400 px-1.5 py-0.5 rounded-[1.5px] font-bold bg-red-955/10 uppercase tracking-widest select-none leading-none">
      {level}
    </span>
  );
}

/**
 * MetricCard
 * Key stats display panel
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  colorCodeClass?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, trend, trendType = 'neutral', colorCodeClass = 'text-white', icon, className = '' }: MetricCardProps) {
  const trendColor = trendType === 'up' ? 'text-emerald-400' : trendType === 'down' ? 'text-red-400' : 'text-gray-500';
  return (
    <div className={`bg-black/30 border border-[#1a5c1a]/20 p-2 rounded-sm flex flex-col justify-between hover:border-[#1a5c1a]/40 transition-colors select-none ${className}`}>
      <div className="flex justify-between items-start">
        <span className="text-[7.5px] text-gray-550 block uppercase font-bold tracking-wider leading-none">
          {label}
        </span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      
      <div className="flex justify-between items-end mt-1.5">
        <span className={`${colorCodeClass} text-[11px] font-black tracking-tight leading-none`}>
          {value}
        </span>
        {trend && (
          <span className={`${trendColor} text-[7.5px] font-bold leading-none`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * KeyValueGrid
 * Compact property grids
 */
interface KeyValueGridProps {
  data: { label: string; value: React.ReactNode; isAccent?: boolean; valClass?: string }[];
  className?: string;
}

export function KeyValueGrid({ data, className = '' }: KeyValueGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-1.5 bg-black/25 p-2 border border-[#1a5c1a]/15 rounded-sm select-none ${className}`}>
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col space-y-0.5">
          <span className="text-[7px] text-gray-550 block uppercase font-bold tracking-wider leading-none">{item.label}:</span>
          <div className={`text-[9.5px] font-extrabold leading-tight ${
            item.isAccent ? 'text-[#00ff44]' : 'text-gray-300'
          } ${item.valClass || ''}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * AlertCard
 * Inline notices & warnings
 */
interface AlertCardProps {
  title: string;
  message: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  className?: string;
}

export function AlertCard({ title, message, severity = 'MEDIUM', className = '' }: AlertCardProps) {
  const meta = SEVERITY_METADATA[severity];
  
  return (
    <div className={`p-2.5 border rounded-sm flex gap-2 items-start ${meta.bgClass} ${meta.borderClass} ${className} select-none animate-slide-up`}>
      <ShieldAlert className={`w-4 h-4 shrink-0 ${meta.colorClass}`} />
      <div className="space-y-0.5 leading-tight">
        <span className={`text-[8.5px] font-black uppercase tracking-wide block ${meta.colorClass}`}>{title}</span>
        <p className="text-[8px] text-gray-400 leading-normal font-sans">{message}</p>
      </div>
    </div>
  );
}

/**
 * EventRow
 * Compact visual list row
 */
interface EventRowProps {
  tick: number;
  title: string;
  description: string;
  severity: SeverityType;
  tags?: string[];
  onClick?: () => void;
  isSelected?: boolean;
}

export function EventRow({ tick, title, description, severity, tags = [], onClick, isSelected = false }: EventRowProps) {
  const meta = SEVERITY_METADATA[severity];
  
  return (
    <div
      onClick={onClick}
      className={`p-2 border rounded-sm transition-all cursor-pointer flex flex-col space-y-1 ${meta.bgClass} ${
        isSelected ? 'border-[#00ff44] bg-[#0c1e0c]' : `${meta.borderClass} hover:bg-black/40`
      }`}
    >
      <div className="flex justify-between items-center text-[7.5px]">
        <div className="flex items-center gap-1">
          <span className="bg-[#020502] px-1 text-gray-500 font-bold border border-[#1a5c1a]/20">TICK {tick}</span>
          <span className={`font-bold uppercase ${meta.colorClass}`}>{title}</span>
        </div>
        <span className={`text-[6.5px] px-1 font-extrabold uppercase rounded-sm border ${meta.borderClass} ${meta.colorClass}`}>
          {severity}
        </span>
      </div>
      
      <p className="text-[9px] text-gray-400 leading-relaxed font-sans truncate pl-2">
        {description}
      </p>

      {tags.length > 0 && (
        <div className="flex gap-1 pl-2 pt-0.5 select-none">
          {tags.map((tag) => (
            <span key={tag} className="text-[7px] text-gray-550 lowercase font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyState
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = 'No telemetry acquired', 
  message = 'Sensor scan sweep complete. System reporting default ambient state.', 
  icon = <Terminal className="w-5 h-5 text-gray-650 mb-1" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 py-8 border border-dashed border-[#1a5c1a]/20 rounded bg-[#010301]/20 select-none">
      {icon}
      <span className="text-[9.5px] uppercase font-black text-gray-400 tracking-wider mb-0.5 mt-1">{title}</span>
      <p className="text-[8px] text-gray-600 uppercase max-w-[200px] leading-relaxed mx-auto font-sans">{message}</p>
    </div>
  );
}

/**
 * DossierCard
 * Entity Dossier view pattern
 */
interface DossierCardProps {
  title: string;
  subtitle?: string;
  classification?: string;
  summaryStrip?: string;
  metrics?: { label: string; value: React.ReactNode; isAccent?: boolean; valClass?: string }[];
  contentNode?: React.ReactNode;
  tags?: string[];
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function DossierCard({
  title,
  subtitle,
  classification = 'CONFIDENTIAL',
  summaryStrip,
  metrics = [],
  contentNode,
  tags = [],
  onDismiss,
  dismissLabel = 'DISMISS SYSTEM DOSSIER'
}: DossierCardProps) {
  return (
    <div className="w-full bg-[#030603] border border-[#1a5c1a]/40 p-3 text-white font-mono text-[10.5px] space-y-3 rounded-sm relative select-none animate-fade-in shadow-xl">
      
      {/* Dossier classified ribbon header */}
      <div className="p-2 bg-[#061206] border border-[#1a5c1a] rounded-sm flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-[12px] font-extrabold tracking-widest text-[#00ff44] uppercase leading-none truncate p-0.5">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[8px] text-gray-500 uppercase font-semibold mt-1 tracking-wider leading-none">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 pl-2">
          <span className="text-[7.5px] border border-red-500/40 text-red-500 px-1.5 py-0.5 rounded-[1.5px] font-bold bg-red-955/10 uppercase tracking-widest leading-none">
            {classification}
          </span>
          {onDismiss && (
            <button
              onClick={() => { audio.sfxKeyClick(); onDismiss(); }}
              className="text-gray-500 hover:text-white text-[8px] font-extrabold border border-[#1a3a1a] px-1.5 py-0.5 bg-black/40 cursor-pointer"
            >
              DISMISS
            </button>
          )}
        </div>
      </div>

      {/* Summary briefing strip */}
      {summaryStrip && (
        <div className="p-2 bg-[#020502]/90 border border-emerald-950 rounded-sm text-[8px] text-gray-400 font-sans leading-relaxed">
          <span className="text-gray-550 block font-bold uppercase tracking-wide mb-1 leading-none">STRATEGIC DOSSIER BRIEFING:</span>
          {summaryStrip}
        </div>
      )}

      {/* Primary Metrics Sheet */}
      {metrics.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider leading-none">KEY SYSTEM METRICS:</span>
          <KeyValueGrid data={metrics} />
        </div>
      )}

      {/* Custom contents */}
      {contentNode && (
        <div className="space-y-1.5 leading-none">
          {contentNode}
        </div>
      )}

      {/* Tags footer */}
      {tags.length > 0 && (
        <div className="border-t border-[#1a5c1a]/15 pt-2 flex flex-wrap gap-1 select-none">
          {tags.map((tag) => (
            <span key={tag} className="text-[7px] text-gray-500 bg-[#020502] px-1 border border-[#1a5c1a]/15 uppercase rounded-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {onDismiss && (
        <button
          onClick={() => { audio.sfxKeyClick(); onDismiss(); }}
          className="w-full text-center py-1.5 text-[8.5px] tracking-wider font-bold text-gray-500 bg-black/40 border border-[#1a3a1a] hover:text-white hover:bg-black/60 rounded cursor-pointer transition-all uppercase"
        >
          {dismissLabel}
        </button>
      )}

    </div>
  );
}

/* ==========================================================================
   3. INTERACTION PRIMITIVES
   ========================================================================== */

/**
 * ActionButton
 * styled strategic workspace buttons
 */
interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'terminal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export function ActionButton({ 
  children, 
  variant = 'secondary', 
  size = 'sm', 
  icon, 
  className = '', 
  onClick, 
  disabled,
  type = 'button',
  title,
  ...props 
}: ActionButtonProps) {
  const baseStyle = "font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer border rounded-sm text-center font-mono active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variantStyles: Record<string, string> = {
    primary: "bg-[#0b1f0d] border-[#00ff44]/70 hover:border-[#00ff44] text-[#00ff44] hover:bg-[#153a15]/40 shadow-[0_0_8px_rgba(0,255,68,0.1)]",
    secondary: "bg-[#020502] border-[#1a5c1a]/35 text-gray-400 hover:border-[#1a5c1a]/90 hover:text-white",
    danger: "bg-[#1f0b0d] border-red-500/50 hover:border-red-500 text-red-400 hover:bg-[#3a1515]/45",
    warning: "bg-[#1f160b] border-[#ffb000]/50 hover:border-[#ffb000] text-[#ffb000] hover:bg-[#3a2c15]/40",
    terminal: "bg-[#030603] border-[#113111]/30 text-[#00ff44]/80 hover:text-[#00ff44] hover:border-[#00ff44]/50 hover:bg-[#0c1a0c]"
  };

  const sizeStyles: Record<string, string> = {
    xs: "py-0.5 px-2 text-[7.5px]",
    sm: "py-1 px-3 text-[8.5px]",
    md: "py-1.5 px-3.5 text-[9px]",
    lg: "py-2 px-6 text-[10px]"
  };

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (variant === 'danger') {
      audio.sfxMissileLaunch();
    } else {
      audio.sfxKeyClick();
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      onClick={handleActionClick}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

/**
 * IconButton
 */
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip?: string;
  active?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: string;
}

export function IconButton({ 
  icon, 
  tooltip, 
  active = false, 
  className = '', 
  onClick, 
  disabled,
  title,
  ...props 
}: IconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const activeClass = active 
    ? 'border-[#00ff44] text-[#00ff44] bg-[#0c180c]' 
    : 'border-[#1a5c1a]/30 bg-black/40 text-gray-550 hover:text-white hover:border-[#1a5c1a]/70';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    audio.sfxKeyClick();
    if (onClick) onClick(e);
  };

  return (
    <div 
      className="relative shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleClick}
        className={`p-1.5 border rounded-sm transition-all cursor-pointer flex items-center justify-center ${activeClass} ${className}`}
        disabled={disabled}
        title={title || tooltip}
        {...props}
      >
        {icon}
      </button>
      
      {tooltip && showTooltip && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#030603] border border-[#1a5c1a]/70 text-[#00ff44] text-[7px] font-bold uppercase rounded-sm z-50 whitespace-nowrap leading-none select-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}

/**
 * SearchBar
 */
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'SEARCH TELEMETRY DATA...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative flex items-center bg-[#010401] border border-[#1a5c1a]/30 rounded-sm select-none ${className}`}>
      <Search className="w-3.5 h-3.5 text-gray-550 absolute left-2 cursor-default select-none pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent pl-7 pr-7 py-1 rounded text-[9.5px] text-white focus:outline-none focus:border-[#00ff44] uppercase placeholder:text-gray-700 font-mono tracking-wide mt-[-1px]"
      />
      {value && (
        <button
          onClick={() => { audio.sfxKeyClick(); onChange(''); }}
          className="absolute right-2 text-gray-550 hover:text-white cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * FilterChip
 */
interface FilterChipProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  activeColorClass?: string;
  className?: string;
}

export function FilterChip({ label, count, active, onClick, activeColorClass = 'text-[#00ff44] border-[#00ff44]/70 bg-[#0d180d]', className = '' }: FilterChipProps) {
  const activeClass = active
    ? activeColorClass
    : 'border-[#1a3a1a]/30 bg-black/20 text-gray-500 hover:text-gray-300';
    
  return (
    <button
      onClick={() => { audio.sfxKeyClick(); onClick(); }}
      className={`px-1.5 py-0.5 rounded-[1px] border text-[8px] uppercase font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${activeClass} ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-[7px] text-gray-600 bg-black/30 px-1 rounded-sm leading-none">{count}</span>
      )}
    </button>
  );
}

/**
 * ExpandableSection
 */
interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ExpandableSection({ title, children, defaultExpanded = false }: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border border-[#1a5c1a]/15 rounded bg-black/10 overflow-hidden">
      <div 
        onClick={() => { audio.sfxKeyClick(); setExpanded(!expanded); }}
        className={`flex items-center justify-between p-1.5 px-2 bg-black/55 cursor-pointer hover:bg-[#071307] select-none transition-colors border-b border-[#1a5c1a]/10`}
      >
        <span className="text-white text-[8px] font-bold uppercase tracking-wider">{title}</span>
        {expanded ? <ChevronDown className="w-3 text-gray-550" /> : <ChevronRight className="w-3 text-gray-550" />}
      </div>
      
      {expanded && (
        <div className="p-2 space-y-1.5 bg-[#030603]/40 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * ToggleGroup
 * Horizontally coupled toggle list items
 */
interface ToggleGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function ToggleGroup<T extends string>({ options, value, onChange, className = '' }: ToggleGroupProps<T>) {
  return (
    <div className={`grid grid-flow-col auto-cols-max gap-1 bg-black/30 p-1 border border-emerald-950/40 rounded-sm select-none ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => { audio.sfxKeyClick(); onChange(opt.value); }}
            className={`py-0.5 px-2 text-[7.5px] uppercase font-extrabold cursor-pointer transition-all rounded-[1px] ${
              isActive
                ? 'bg-[#00ff44]/15 text-[#00ff44] border border-[#00ff44]/40 font-bold'
                : 'text-gray-550 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * StepControl
 * Simulation step tick buttons widget panel
 */
interface StepControlProps {
  currentTick: number;
  tickSpeed: string;
  onSetTickSpeed: (speed: 'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA') => void;
  onStep: () => void;
}

export function StepControl({ currentTick, tickSpeed, onSetTickSpeed, onStep }: StepControlProps) {
  const speedStates: { id: 'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA'; label: string; icon: React.ReactNode }[] = [
    { id: 'PAUSED', label: 'HALT', icon: <Pause className="w-3 h-3" /> },
    { id: 'NORMAL', label: '1X', icon: <Play className="w-3 h-3" /> },
    { id: 'FAST', label: '2X', icon: <FastForward className="w-3 h-3" /> },
    { id: 'ULTRA', label: 'MAX', icon: <Sliders className="w-3 h-3" /> },
  ];

  return (
    <div className="bg-[#050e05] border border-[#1a5c1a]/55 rounded p-2 flex items-center justify-between gap-4 font-mono select-none">
      <div className="flex flex-col">
        <span className="text-[7.5px] text-gray-550 uppercase font-black tracking-widest leading-none">simulation tick</span>
        <span className="text-white text-[12px] font-black tracking-wider mt-0.5 leading-none">
          {currentTick.toLocaleString()}
        </span>
      </div>

      <div className="h-6 w-[1px] bg-[#1a5c1a]/30" />

      {/* Speed choices */}
      <div className="flex gap-0.5 bg-black/45 p-0.5 border border-[#113111]/80 rounded-sm">
        {speedStates.map((st) => {
          const isActive = tickSpeed === st.id;
          return (
            <button
              key={st.id}
              onClick={() => {
                audio.sfxKeyClick();
                onSetTickSpeed(st.id);
              }}
              title={`Sim speed: ${st.id}`}
              className={`p-1.5 px-2.5 flex flex-col items-center justify-center gap-0.5 font-bold transition-all rounded-[1px] cursor-pointer ${
                isActive
                  ? 'bg-[#153a15] border border-[#00ff44]/75 text-[#00ff44]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {st.icon}
              <span className="text-[6px] tracking-tight">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* Manual tick nudge */}
      <button
        onClick={() => {
          audio.playPhaseReveal();
          onStep();
        }}
        title="Pulse Simulation Step [F12]"
        className="px-3 py-2 bg-[#092209] hover:bg-[#124212] border border-[#00ff44] text-[#00ff44] font-black uppercase text-[8px] tracking-widest cursor-pointer rounded-sm hover:shadow-[0_0_8px_rgba(0,255,68,0.2)] transition-all flex flex-col items-center justify-center leading-none"
      >
        <Activity className="w-3 h-3 animate-pulse mb-0.5" />
        <span>STEP</span>
      </button>
    </div>
  );
}

/* ==========================================================================
   4. MAP-ADJACENT PRIMITIVES
   ========================================================================== */

/**
 * FloatingLegend
 * Absolute layout floating legend card
 */
interface FloatingLegendProps {
  title: string;
  items: { color: string; label: string; symbol?: React.ReactNode }[];
  className?: string;
}

export function FloatingLegend({ title, items, className = '' }: FloatingLegendProps) {
  return (
    <div className={`p-2.5 bg-[#030603]/90 border border-[#1a5c1a]/50 rounded-sm font-mono text-[8px] shadow-lg select-none ${className}`}>
      <span className="font-bold text-[#fafafa] uppercase block border-b border-[#1a5c1a]/20 pb-1 mb-1.5 tracking-wider">
        {title}
      </span>
      <div className="space-y-1.5">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {it.symbol ? (
              <div className="shrink-0">{it.symbol}</div>
            ) : (
              <div className={`w-2 h-2 rounded-full border border-black/30 shrink-0`} style={{ backgroundColor: it.color }} />
            )}
            <span className="text-gray-400 capitalize">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MapInfoTray
 * Horizontal world summary telemetry strip
 */
interface MapInfoTrayProps {
  fields: { label: string; value: React.ReactNode; isAccent?: boolean }[];
  className?: string;
}

export function MapInfoTray({ fields, className = '' }: MapInfoTrayProps) {
  return (
    <div className={`flex flex-wrap items-center bg-[#051105]/95 border border-[#1a5c1a] rounded px-3 py-1.5 gap-x-5 gap-y-1.5 shadow-lg select-none font-mono ${className}`}>
      {fields.map((f, idx) => (
        <div key={idx} className="flex items-center gap-1.5 text-[8.5px]">
          <span className="text-gray-500 uppercase font-bold tracking-wider leading-none">{f.label}:</span>
          <span className={`font-black uppercase tracking-normal leading-none ${
            f.isAccent ? 'text-[#00ff44]' : 'text-white'
          }`}>
            {f.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * RegionStatStrip
 * Summarize alignments count nicely
 */
export function RegionStatStrip({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex gap-2 text-[8px] uppercase select-none font-sans mt-1">
      {Object.entries(counts).map(([name, val]) => (
        <span key={name} className="bg-black/45 border border-[#1a5c1a]/15 px-1.5 py-0.5 text-gray-400 rounded-sm">
          {name}: <b className="text-white font-mono">{val}</b>
        </span>
      ))}
    </div>
  );
}
