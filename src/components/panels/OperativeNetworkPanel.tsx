import React, { useState, useEffect } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useOperativeStore } from '../../store/operativeStore';
import { Network, ShieldAlert, Cpu, Activity, UserX, UserCheck, Search, Filter } from 'lucide-react';
import AnimatedValue from '../shared/AnimatedValue';
import { generateOperative } from '../../sim/operativeEngine';
import { usePlayerStore } from '../../store/playerStore';

export default function OperativeNetworkPanel() {
  const opStore = useOperativeStore();
  const directives = usePlayerStore(s => s.countryId);
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'CELLS' | 'GRAPH'>('ASSETS');

  const operatives = Object.values(opStore.operatives);
  const cells = Object.values(opStore.cells);
  
  const activeOps = operatives.filter(o => o.state === 'ACTIVE').length;
  const burnedOps = operatives.filter(o => o.state === 'BURNED').length;
  const compromisedOps = operatives.filter(o => o.state === 'COMPROMISED').length;

  useEffect(() => {
    if (operatives.length === 0 && directives) {
      const op1 = generateOperative(directives, "NORTH_AMERICA");
      op1.state = 'ACTIVE';
      opStore.addOperative(op1.id, op1);
      
      const op2 = generateOperative(directives, "EAST_ASIA");
      op2.state = 'ACTIVE';
      opStore.addOperative(op2.id, op2);

      const op3 = generateOperative(directives, "EUROPE");
      op3.state = 'DORMANT';
      opStore.addOperative(op3.id, op3);

      opStore.addNetworkLink(op1.id, op2.id, 'CONTACT');
      opStore.addNetworkLink(op1.id, op3.id, 'KNOWS');
    }
  }, [operatives.length, directives]);

  return (
    <PanelFxShell panelId="cia_operatives" relevantFxTypes={['COUP_SUCCESS','COUP_ATTEMPT_FAILED','REGIME_CHANGE','OPERATIVE_BURNED','REGIME_PRESSURE_CRITICAL']}>
      <div className="flex flex-col h-full bg-black/60 text-[#00e5ff] font-mono p-4" style={{ WebkitFontSmoothing: 'none' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-[#00e5ff]/30 pb-3">
        <div className="flex items-center space-x-3">
          <Network className="w-5 h-5 text-[#00e5ff]" />
          <div>
            <h2 className="text-sm font-bold tracking-widest text-white uppercase drop-shadow-[0_0_2px_rgba(0,229,255,0.8)]">
              Operative Network Command
            </h2>
            <div className="text-[10px] text-[#00e5ff]/70 flex space-x-4 mt-1">
              <span>SYSTEM: <span className="text-white">ONLINE</span></span>
              <span>NODES: <span className="text-white">{operatives.length}</span></span>
              <span>COMPROMISED: <span className={compromisedOps > 0 ? "text-amber-400" : "text-white"}>{compromisedOps}</span></span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('ASSETS')}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors duration-200 border border-[#00e5ff]/30 ${activeTab === 'ASSETS' ? 'bg-[#00e5ff]/20 text-white' : 'hover:bg-[#00e5ff]/10 text-[#00e5ff]/60'}`}
          >
            Asset Roster
          </button>
          <button 
            onClick={() => setActiveTab('CELLS')}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors duration-200 border border-[#00e5ff]/30 ${activeTab === 'CELLS' ? 'bg-[#00e5ff]/20 text-white' : 'hover:bg-[#00e5ff]/10 text-[#00e5ff]/60'}`}
          >
            Cell Topology
          </button>
          <button 
            onClick={() => setActiveTab('GRAPH')}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors duration-200 border border-[#00e5ff]/30 ${activeTab === 'GRAPH' ? 'bg-[#00e5ff]/20 text-white' : 'hover:bg-[#00e5ff]/10 text-[#00e5ff]/60'}`}
          >
            Exposure Graph
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'ASSETS' && <AssetRosterView operatives={operatives} />}
        {activeTab === 'CELLS' && <CellTopologyView cells={cells} operatives={operatives} handlers={Object.values(opStore.handlers)} />}
        {activeTab === 'GRAPH' && <ExposureGraphView />}
      </div>

    </div>
    </PanelFxShell>
  );
}

function AssetRosterView({ operatives }: { operatives: any[] }) {
  const opStore = useOperativeStore();

  const handleBurn = (id: string) => {
    opStore.burnOperative(id, "Command initiated extraction / burn protocol.", 0);
  };

  return (
    <div className="h-full flex flex-col space-y-2 overflow-y-auto pr-2 custom-scrollbar">
      {operatives.map(op => (
        <div key={op.id} className="bg-black/40 border border-[#00e5ff]/20 p-3 hover:border-[#00e5ff]/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${op.state === 'ACTIVE' ? 'bg-[#00e5ff]' : op.state === 'DORMANT' ? 'bg-gray-500' : op.state === 'COMPROMISED' ? 'bg-amber-400' : 'bg-red-500'}`} />
                <h3 className="text-white text-xs font-bold leading-none">{op.alias}</h3>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#00e5ff]/10 text-[#00e5ff]">[{op.coverType}]</span>
              </div>
              <div className="text-[9px] text-[#00e5ff]/50 mt-1 uppercase">LOC: {op.regionOfOperation} | SRC: {op.recruitmentSource}</div>
            </div>
            
            <div className="flex items-center space-x-3 text-[10px]">
              <div className="flex flex-col items-end">
                <span className="text-[#00e5ff]/50">BURN RISK</span>
                <span className={`${op.burnRisk > 70 ? 'text-red-500 font-bold drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]' : op.burnRisk > 40 ? 'text-amber-400' : 'text-white'}`}>
                  {op.burnRisk.toFixed(0)}%
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#00e5ff]/50">STRESS</span>
                <span className={`${op.stress > 70 ? 'text-amber-400' : 'text-white'}`}>{op.stress.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#00e5ff]/50">LOYALTY</span>
                <span className={`${op.loyalty < 40 ? 'text-red-500' : 'text-white'}`}>{op.loyalty.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Expanded Actions/Details */}
          <div className="flex justify-between items-end mt-3 pt-2 border-t border-[#00e5ff]/10">
            <div className="flex space-x-2">
               <span className="text-[9px] text-[#00e5ff]/40">VAL: {op.operationalValue}</span>
               <span className="text-[9px] text-[#00e5ff]/40">REL: {op.reliability}</span>
               <span className="text-[9px] text-[#00e5ff]/40">EXP: {op.exposureLevel}%</span>
            </div>
            {op.state !== 'BURNED' && (
              <button 
                onClick={() => handleBurn(op.id)}
                className="text-[9px] text-red-500 border border-red-500/30 bg-red-500/10 px-2 py-0.5 hover:bg-red-500/30 transition-colors uppercase tracking-widest"
              >
                Burn / Extract
              </button>
            )}
            {op.state === 'BURNED' && (
              <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest whitespace-nowrap">Asset Burned</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CellTopologyView({ cells, operatives, handlers }: { cells: any[], operatives: any[], handlers: any[] }) {
  if (cells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 opacity-50 border border-dashed border-[#00e5ff]/30 h-full text-center">
        <Activity className="w-8 h-8 mb-2 text-[#00e5ff]" />
        <p className="text-xs">NO DISCRETE CELLS ESTABLISHED</p>
        <p className="text-[10px] mt-2 max-w-xs">Assets are operating independently. Form compartmentalized cells to mitigate burn cascade risks across the network.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pr-2 custom-scrollbar">
      {cells.map(cell => {
        if (!cell) return null;
        const cellOps = operatives.filter(o => o && o.cellId === cell.id);
        const handler = handlers.find(h => h && h.id === cell.handlerId);
        
        return (
          <div key={cell.id} className="bg-[#001015] border border-[#00e5ff]/30 p-3 relative hover:bg-[#001a22] transition-colors">
            {/* Exposure Boundary Visualizer */}
            <div 
              className="absolute top-0 right-0 bottom-0 w-1 bg-[#00e5ff]/20"
              style={{ opacity: cell.exposureBoundary / 100 }}
            />
            
            <div className="flex justify-between items-start mb-3 border-b border-[#00e5ff]/20 pb-2">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wider flex items-center">
                  <Cpu className="w-3 h-3 mr-1.5 text-[#00e5ff]" />
                  {cell.designation} <span className="opacity-50 ml-2 font-normal">[{cell.operationalFocus}]</span>
                </h4>
                <div className="text-[10px] opacity-70 mt-1 uppercase">Region: {cell.region}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] opacity-70">EXPOSURE BOUNDARY</div>
                <div className="text-white text-xs font-bold">{cell.exposureBoundary}%</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] uppercase opacity-50 block mb-1">Handler Interface</span>
                {handler ? (
                  <div className="text-[10px] flex items-center bg-[#00e5ff]/5 border border-[#00e5ff]/10 p-1.5">
                    <UserCheck className="w-3 h-3 mr-1.5 text-white/50" />
                    <div>
                      <div className="text-white">{handler.alias}</div>
                      <div className="opacity-50">TRUST: {handler.trustLevel}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] opacity-30 italic">Unassigned (Max Risk)</div>
                )}
              </div>
              
              <div>
                <span className="text-[9px] uppercase opacity-50 block mb-1">Assigned Assets ({cellOps.length}/{cell.maxSize})</span>
                <div className="flex -space-x-1">
                  {cellOps.map(o => (
                    <div 
                      key={o.id} 
                      className={`w-5 h-5 rounded-sm border border-[#001015] flex items-center justify-center text-[8px] font-bold ${
                        o.state === 'ACTIVE' ? 'bg-[#00e5ff] text-black' : 
                        o.state === 'COMPROMISED' ? 'bg-amber-400 text-black' : 
                        o.state === 'BURNED' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'
                      }`}
                      title={o.alias}
                    >
                      {o.alias.substring(0, 1)}
                    </div>
                  ))}
                  {cellOps.length === 0 && <span className="text-[10px] opacity-30 italic">No assets</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExposureGraphView() {
  const store = useOperativeStore();
  const nodes = store.networkGraph.nodes;
  const links = store.networkGraph.links;

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 opacity-50 border border-dashed border-[#00e5ff]/30 h-full text-center">
         <Search className="w-8 h-8 mb-2 text-[#00e5ff]" />
         <p className="text-xs">NO GRAPH TOPOLOGY AVAILABLE</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative custom-scrollbar overflow-y-auto">
      <div className="absolute top-0 right-2 text-[9px] text-[#00e5ff]/50 border border-[#00e5ff]/10 bg-black/50 p-1 z-10 flex flex-col space-y-1">
        <h4 className="font-bold text-white mb-0.5 tracking-widest text-[#00e5ff]">CASCADE KEY</h4>
        <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-[#00e5ff]"></span><span>ACTIVE</span></div>
        <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-amber-400"></span><span>COMPROMISED</span></div>
        <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-red-500"></span><span>BURNED</span></div>
      </div>

      <div className="w-full mt-4 pb-4 grid grid-cols-1 gap-2">
        {nodes.map(nodeId => {
          const op = store.operatives[nodeId];
          if (!op) return null;
          
          const opLinks = links.filter(l => l.source === nodeId || l.target === nodeId);
          
          return (
            <div key={nodeId} className="border border-[#00e5ff]/10 p-2 bg-[#001015] flex justify-between items-center hover:bg-[#001a22] transition-colors">
              <div className="flex items-center space-x-3">
                <span className={`w-2.5 h-2.5 rounded-full ${op.state === 'ACTIVE' ? 'bg-[#00e5ff] shadow-[0_0_5px_#00e5ff]' : op.state === 'COMPROMISED' ? 'bg-amber-400' : op.state === 'BURNED' ? 'bg-red-500' : 'bg-gray-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white tracking-widest">{op.alias}</div>
                  <div className="text-[9px] text-[#00e5ff]/60 uppercase">{op.coverType} // RISK: {op.burnRisk.toFixed(0)}%</div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[8px] opacity-40 mb-1 tracking-widest">NETWORK THREADS ({opLinks.length})</span>
                <div className="flex space-x-1">
                  {opLinks.length === 0 ? <span className="text-white/20 text-[9px] italic">Isolated</span> : 
                   opLinks.map((l, i) => {
                     const isSource = l.source === nodeId;
                     const adjacentId = isSource ? l.target : l.source;
                     const targetOp = store.operatives[adjacentId];
                     if (!targetOp) return null;

                     return (
                       <div key={i} className={`text-[9px] px-1.5 py-0.5 border ${targetOp.state === 'BURNED' || targetOp.state === 'COMPROMISED' ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-[#00e5ff]/30 text-[#00e5ff]/70 bg-[#00e5ff]/10'}`} title={`Connected to ${targetOp.alias} via ${l.type}`}>
                         {isSource ? 'Out \u2794' : '\u2794 In'} {targetOp.alias}
                       </div>
                     );
                   })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}