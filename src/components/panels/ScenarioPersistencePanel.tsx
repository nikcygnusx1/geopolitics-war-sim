import React, { useState, useEffect, useRef } from 'react';
import { 
  listSavedScenarios, 
  saveScenarioToBrowser, 
  deleteScenarioFromBrowser, 
  createScenarioSnapshot, 
  hydrateScenario, 
  createShareableLink,
  ScenarioPackage
} from '../../utils/persistence';
import { 
  SectionBlock, 
  ActionButton, 
  StatusBadge, 
  FactChip, 
  KeyValueGrid, 
  EmptyState 
} from '../shared/CommandPrimitives';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';

export default function ScenarioPersistencePanel() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const activeScenario = usePlayerStore((s) => s.activeScenario);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);

  // Local component states
  const [savedList, setSavedList] = useState<ScenarioPackage[]>([]);
  const [saveName, setSaveName] = useState<string>('');
  const [saveDesc, setSaveDesc] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  // States for renaming
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');

  // Save feedback
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });

  // Tracking dirty state (unsaved advances)
  const [lastSavedTick, setLastSavedTick] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSavedList();
  }, []);

  const loadSavedList = async () => {
    setIsLoadingList(true);
    try {
      const list = await listSavedScenarios();
      setSavedList(list);
    } catch (e: any) {
      console.error('Failed to query IndexedDB saved list:', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    audio.sfxSuccessConfirmation();
    setSaveStatus({ type: 'idle', message: '' });

    try {
      const snapshot = createScenarioSnapshot(
        saveName.trim(), 
        saveDesc.trim() || `Classified geopolitical projection run captured on tick ${currentTick}.`,
        'custom'
      );
      
      await saveScenarioToBrowser(snapshot);
      setLastSavedTick(currentTick);
      setSaveName('');
      setSaveDesc('');
      setSaveStatus({ type: 'success', message: `Scenario archived successfully under classified identifier [${snapshot.scenarioId.substring(5, 11).toUpperCase()}].` });
      loadSavedList();

      setTimeout(() => {
        setSaveStatus({ type: 'idle', message: '' });
      }, 5000);
    } catch (err: any) {
      audio.sfxCrisisWarning();
      setSaveStatus({ type: 'error', message: `Write access failure: ${err.message || String(err)}` });
    }
  };

  const handleLoad = async (pkg: ScenarioPackage) => {
    audio.sfxSuccessConfirmation();
    const confirmed = window.confirm(`PROCEED TO BOOT SCENARIO PACKAGE [${pkg.scenarioName}]?\nThis will overwrite all active strategic state indices.`);
    if (!confirmed) return;

    const res = hydrateScenario(pkg);
    if (res.success) {
      setLastSavedTick(pkg.worldState.currentTick);
      usePlayerStore.getState().setActiveTab(1); // switch to state panel
      useUIStore.getState().pushAlert({
        title: 'SCENARIO DEPLOYED',
        message: `Restored environment: "${pkg.scenarioName}" at Tick ${pkg.worldState.currentTick}. Clock schedules successfully retrofitted.`,
        type: 'INFO'
      });
    } else {
      audio.sfxCrisisWarning();
      alert(`HYDRO BOOT ABORTED: ${res.error}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    audio.sfxKeyClick();
    if (!window.confirm(`PERMANENTLY DEPUTIZE DELETION OF "${name}"?\nThis operation is classified as destructive.`)) return;

    try {
      await deleteScenarioFromBrowser(id);
      loadSavedList();
    } catch (e: any) {
      alert(`DELETION FAIL: ${e.message}`);
    }
  };

  const handleDuplicate = async (pkg: ScenarioPackage) => {
    audio.sfxKeyClick();
    try {
      const copy: ScenarioPackage = {
        ...JSON.parse(JSON.stringify(pkg)),
        scenarioId: `scen_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
        scenarioName: `${pkg.scenarioName} (CONFIDENT-COPY)`,
        updatedAt: new Date().toISOString()
      };
      await saveScenarioToBrowser(copy);
      loadSavedList();
    } catch (e: any) {
      alert(`DUPLICATION FAILURE: ${e.message}`);
    }
  };

  const handleStartRename = (pkg: ScenarioPackage) => {
    audio.sfxKeyClick();
    setRenamingId(pkg.scenarioId);
    setNewName(pkg.scenarioName);
  };

  const handleSaveRename = async (pkg: ScenarioPackage) => {
    if (!newName.trim()) return;
    audio.sfxSuccessConfirmation();
    try {
      const updated: ScenarioPackage = {
        ...pkg,
        scenarioName: newName.trim(),
        updatedAt: new Date().toISOString()
      };
      await saveScenarioToBrowser(updated);
      setRenamingId(null);
      loadSavedList();
    } catch (e: any) {
      alert(`RENAME FAILURE: ${e.message}`);
    }
  };

  const handleExport = (pkg: ScenarioPackage) => {
    audio.sfxSuccessConfirmation();
    try {
      const dataStr = JSON.stringify(pkg, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const fileName = `${pkg.scenarioName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_snapshot.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
    } catch (e: any) {
      alert(`EXPORT CRITICAL FAILURE: ${e.message}`);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ type: 'idle', message: '' });
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as ScenarioPackage;
        
        if (!parsed.scenarioId || !parsed.worldState || !parsed.playerState || !parsed.schemaVersion) {
          throw new Error('Invalid JSON architecture: Required ScenarioPackage top-level keys are missing.');
        }

        // Save imported to DB for longevity
        parsed.sourceType = 'imported';
        parsed.updatedAt = new Date().toISOString();
        await saveScenarioToBrowser(parsed);
        
        audio.sfxSuccessConfirmation();
        setImportStatus({
          type: 'success',
          message: `Package "${parsed.scenarioName}" [Schema v${parsed.schemaVersion}] successfully mapped into localized simulation cells.`
        });
        loadSavedList();
      } catch (err: any) {
        audio.sfxCrisisWarning();
        setImportStatus({
          type: 'error',
          message: `Import rejected: ${err.message || 'Check syntax parsing schema integrity.'}`
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyShareLink = async (pkg: ScenarioPackage) => {
    audio.sfxSuccessConfirmation();
    setCopyFeedback(pkg.scenarioId);
    try {
      const link = await createShareableLink(pkg);
      await navigator.clipboard.writeText(link);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (e) {
      console.error(e);
      setCopyFeedback(null);
    }
  };

  // Check dirty state
  const isDirty = lastSavedTick !== null && lastSavedTick !== currentTick;

  return (
    <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
      {/* Simulation Current State Overview row */}
      <div className="border border-[#1a5c1a]/30 rounded-sm bg-black/60 p-3 flex flex-wrap gap-4 justify-between items-center text-[10px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff44] font-black text-[11px] uppercase tracking-wider">Active Projection Feed</span>
            {isDirty ? (
              <span className="px-1 py-0.5 bg-yellow-950/80 border border-yellow-600/50 text-yellow-400 font-bold text-[8px] animate-pulse">
                ⚠️ UNSAVED CHANGES (ADVANCED T_DELTA)
              </span>
            ) : (
              <span className="px-1 py-0.5 bg-[#0a230a] border border-[#1a5c1a] text-[#00ff44] font-bold text-[8px]">
                ✓ SYNCHRONIZED
              </span>
            )}
          </div>
          <p className="text-gray-400 text-[9px] uppercase max-w-[400px]">
            ACTIVE SECTOR: {playerCountryId} | PRESET ID: {activeScenario} | CONTINUOUS SIMULATION TIMER: TICK {currentTick}
          </p>
        </div>

        <div className="flex gap-2">
          {isDirty && (
            <ActionButton 
              variant="warning" 
              size="xs"
              onClick={() => {
                setSaveName(`${activeScenario}_RESERVE_T${currentTick}`);
                setSaveDesc(`Intermittent tactical save point initialized from tick ${currentTick}.`);
              }}
            >
              SNAPSHOT LIVE
            </ActionButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Save Current Projection Form - LEFT/TOP */}
        <div className="lg:col-span-5 space-y-3">
          <SectionBlock title="COLLECT LOCAL CLASSIFIED ARCHIVE">
            <form onSubmit={handleSaveCurrent} className="space-y-3 bg-[#030603] border border-[#1a5c1a]/30 p-3 rounded-sm text-[10px]">
              <div className="space-y-1.5">
                <label className="text-[9px] text-[#00ff44] uppercase tracking-wider font-extrabold">Archive Filename / Name</label>
                <input 
                  type="text" 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g., SECTOR_WARGAUGE_US_T12"
                  className="w-full bg-[#050a05] border border-[#1a5c1a]/50 p-2 text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#00ff44]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#00ff44] uppercase tracking-wider font-extrabold">Strategic Brief / Description</label>
                <textarea 
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  placeholder="Record relevant political, financial, or cyber anomalies..."
                  rows={2}
                  className="w-full bg-[#050a05] border border-[#1a5c1a]/50 p-2 text-white placeholder-gray-600 font-mono focus:outline-none focus:border-[#00ff44] resize-none"
                />
              </div>

              <ActionButton 
                type="submit" 
                variant="primary" 
                size="sm" 
                className="w-full"
                disabled={!saveName.trim()}
              >
                COMMIT SNAPSHOT TO DATABASE
              </ActionButton>

              {saveStatus.message && (
                <div className={`p-2 border text-[9px] font-bold uppercase transition-all ${
                  saveStatus.type === 'success' 
                    ? 'bg-[#0a230a] border-[#0bc235]/40 text-[#19ff56]' 
                    : 'bg-red-950/80 border-red-800/40 text-red-400'
                }`}>
                  {saveStatus.message}
                </div>
              )}
            </form>
          </SectionBlock>

          <SectionBlock title="PORTABLE PACKETS">
            <div className="space-y-2.5 bg-[#030603] border border-[#1a5c1a]/30 p-3 rounded-sm text-[10px]">
              <p className="text-gray-500 uppercase text-[8px] leading-relaxed">
                Drag and drop a custom encoded <b>.json</b> scenario file into the input channel below to decrypt and mount the timeline state securely.
              </p>
              
              <div className="relative border border-dashed border-[#1a5c1a]/40 hover:border-[#00ff44]/60 p-4 rounded bg-black/30 text-center transition-all cursor-pointer">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-[9px] text-[#00ff44] uppercase font-bold tracking-widest">
                  DECODE SYSTEM FILE (.JSON)
                </span>
              </div>

              {importStatus.message && (
                <div className={`p-2 border text-[9px] font-bold uppercase ${
                  importStatus.type === 'success' 
                    ? 'bg-[#0a230a] border-[#0bc235]/40 text-[#19ff56]' 
                    : 'bg-red-950/80 border-red-800/40 text-red-400'
                }`}>
                  {importStatus.message}
                </div>
              )}
            </div>
          </SectionBlock>
        </div>

        {/* Saved Scenarios Archive Directory - RIGHT/BOTTOM */}
        <div className="lg:col-span-7 space-y-3">
          <SectionBlock 
            title="CLASSIFIED OPERATIONS BRIEFING ARCHIVE"
            rightNode={<span className="text-[#0bc235]">{savedList.length} SECURED SAVES</span>}
          >
            {isLoadingList ? (
              <div className="py-12 text-center text-gray-500 animate-pulse font-mono uppercase text-[9px]">
                Scanning cryptographic local drives...
              </div>
            ) : savedList.length === 0 ? (
              <EmptyState 
                title="SOCIETAL DATABASE CLEAN"
                message="No localized wargaming projection traces stored on this sector terminal."
                icon={<div className="text-xl opacity-40 mb-1">🗄️</div>}
              />
            ) : (
              <div className="space-y-3">
                {savedList.map((pkg) => {
                  const isRenaming = renamingId === pkg.scenarioId;
                  
                  return (
                    <div 
                      key={pkg.scenarioId} 
                      className="border border-[#1a5c1a]/40 bg-[#030603] p-3 rounded-sm space-y-2 select-none hover:border-[#1a5c1a]/80 transition-all font-mono text-[10px]"
                    >
                      <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-[#1a5c1a]/20">
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5 w-full mr-2">
                            <input 
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="bg-[#050a05] border border-[#1a5c1a] p-1 text-white text-[10px] w-full"
                            />
                            <button 
                              onClick={() => handleSaveRename(pkg)}
                              className="text-[#00ff44] font-bold hover:underline py-0.5 px-1.5 bg-[#0a230a] border border-[#1a5c1a]"
                            >
                              SAVE
                            </button>
                            <button 
                              onClick={() => setRenamingId(null)}
                              className="text-gray-400 hover:underline py-0.5 px-1.5"
                            >
                              ESC
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-[11px] font-black text-[#00ff44] uppercase tracking-wide leading-none py-0.5 truncate max-w-[200px]">
                                {pkg.scenarioName}
                              </h3>
                              <StatusBadge 
                                label={pkg.sourceType.toUpperCase()} 
                                statusType={
                                  pkg.sourceType === 'preset' ? 'active' : 
                                  pkg.sourceType === 'imported' ? 'strained' : 
                                  'stable'
                                }
                              />
                            </div>
                            <span className="text-[7.5px] text-gray-500 font-bold block mt-1">
                              ID: [{pkg.scenarioId.substring(pkg.scenarioId.length - 12)}] • STAMPED: {new Date(pkg.updatedAt).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-1 shrink-0">
                          <button 
                            title="Rename Scenario"
                            onClick={() => handleStartRename(pkg)}
                            className="p-1 border border-[#1a5c1a]/20 hover:border-[#1a5c1a]/60 bg-black/20 text-gray-400 hover:text-white rounded-sm text-[9px]"
                          >
                            ✏️
                          </button>
                          <button 
                            title="Duplicate Scenario"
                            onClick={() => handleDuplicate(pkg)}
                            className="p-1 border border-[#1a5c1a]/20 hover:border-[#1a5c1a]/60 bg-black/20 text-gray-400 hover:text-white rounded-sm text-[9px]"
                          >
                            👯
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-400 text-[9.5px] uppercase leading-relaxed line-clamp-2">
                        {pkg.scenarioDescription}
                      </p>

                      {/* Info Chips Grid */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#1a5c1a]/15">
                        <span className="px-1.5 py-0.5 bg-black/40 border border-[#1a5c1a]/30 text-gray-400 text-[8px] font-bold uppercase rounded-[1px] tracking-wider leading-none">
                          TICK <span className="text-[#00ff44]">{pkg.clockState.currentTick}</span>
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/40 border border-[#1a5c1a]/30 text-gray-400 text-[8px] font-bold uppercase rounded-[1px] tracking-wider leading-none">
                          THREAT <span className={
                            pkg.worldState.globalThreatLevel === 'RED' ? 'text-red-500 font-extrabold animate-pulse' :
                            pkg.worldState.globalThreatLevel === 'ORANGE' ? 'text-orange-400 font-semibold' :
                            pkg.worldState.globalThreatLevel === 'YELLOW' ? 'text-yellow-400' :
                            'text-[#0bc235]'
                          }>{pkg.worldState.globalThreatLevel}</span>
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/40 border border-[#1a5c1a]/30 text-gray-400 text-[8px] font-bold uppercase rounded-[1px] tracking-wider leading-none">
                          SECTOR <span className="text-white font-extrabold">{pkg.playerState.countryId}</span>
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/40 border border-[#1a5c1a]/30 text-gray-400 text-[8px] font-bold uppercase rounded-[1px] tracking-wider leading-none">
                          VERSION <span className="text-gray-200">{pkg.schemaVersion}</span>
                        </span>
                      </div>

                      {/* Primary Actions row */}
                      <div className="flex justify-between items-center gap-2 pt-2">
                        <ActionButton 
                          variant="primary" 
                          size="xs" 
                          className="px-4"
                          onClick={() => handleLoad(pkg)}
                        >
                          DEPLOY WORLD
                        </ActionButton>

                        <div className="flex gap-1.5">
                          <ActionButton 
                            variant="secondary" 
                            size="xs"
                            onClick={() => handleExport(pkg)}
                            title="Download JSON save file"
                          >
                            EXPORT
                          </ActionButton>
                          <ActionButton 
                            variant="terminal" 
                            size="xs"
                            onClick={() => handleCopyShareLink(pkg)}
                          >
                            {copyFeedback === pkg.scenarioId ? '✓ COPIED' : '🔗 SHARE'}
                          </ActionButton>
                          <ActionButton 
                            variant="danger" 
                            size="xs"
                            onClick={() => handleDelete(pkg.scenarioId, pkg.scenarioName)}
                          >
                            DELETE
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}

// End of file

