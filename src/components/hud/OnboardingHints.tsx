import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { audio } from '../../utils/audio';

export default function OnboardingHints() {
  const {
    isOnboardingActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    dismissOnboarding
  } = useOnboardingStore();

  const [boxPosition, setBoxPosition] = useState({ top: '15%', left: '5%' });
  const activeStep = steps[currentStep];

  // Dynamically position the hint relative to the screen layout targets
  useEffect(() => {
    if (!isOnboardingActive || !activeStep) return;

    // Anchor coordinates matching standard dashboard regions
    switch (activeStep.target) {
      case 'switcher':
        setBoxPosition({ top: '65px', left: '20px' });
        break;
      case 'inspector':
        setBoxPosition({ top: '120px', left: '33%' });
        break;
      case 'surface':
        setBoxPosition({ top: '35%', left: '15%' });
        break;
      case 'actions':
        setBoxPosition({ top: '90px', left: 'calc(58% - 330px)' });
        break;
      default:
        setBoxPosition({ top: '20%', left: '25%' });
    }
  }, [currentStep, activeStep, isOnboardingActive]);

  if (!isOnboardingActive || !activeStep) return null;

  const handleNext = () => {
    audio.sfxKeyClick();
    nextStep();
  };

  const handlePrev = () => {
    audio.sfxKeyClick();
    prevStep();
  };

  const handleSkip = () => {
    audio.sfxRadarPing();
    dismissOnboarding();
  };

  return (
    <>
      {/* 1. Global Highlighting Portal (Screener) */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Draw a subtle border outline glow around the target container selector to focus attention */}
        <div
          className={`absolute transition-all duration-500 ease-in-out border-2 shadow-[0_0_15px_rgba(0,255,68,0.25)] pointer-events-none rounded ${
            activeStep.target === 'switcher'
              ? 'top-[44px] left-0 w-[58%] h-[36px] border-[#00ff44]'
              : activeStep.target === 'inspector'
              ? 'top-[80px] left-[calc(58%-230px)] w-[230px] h-[calc(100vh-345px)] border-[#00ff44]'
              : activeStep.target === 'surface'
              ? 'top-[80px] left-0 w-[calc(58%-230px)] h-[calc(100vh-345px)] border-cyan-400'
              : activeStep.target === 'actions'
              ? 'top-[44px] left-[58%] w-[42%] h-[calc(100vh-305px)] border-amber-500'
              : 'hidden'
          }`}
        >
          {/* Pulsing indicator light inside high-focus sector */}
          <div className="absolute top-1 left-1 flex h-2 w-2 select-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff44] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff44]"></span>
          </div>
          
          <div className="absolute right-2 top-1 text-[8px] tracking-widest text-[#00ff44] font-bold bg-black/90 px-1 border border-[#00ff44]/20 select-none animate-pulse uppercase">
            TARGET {activeStep.target} SECURE
          </div>
        </div>
      </div>

      {/* 2. Tactical floating briefing card */}
      <div
        style={{
          top: boxPosition.top,
          left: boxPosition.left,
          maxWidth: '310px'
        }}
        className="fixed z-40 bg-[#020502]/95 border-2 border-[#1a5c1a] shadow-[0_4px_16px_rgba(0,0,0,0.85)] p-3.5 rounded text-white font-mono text-[10.5px] space-y-3 transition-all duration-500 pointer-events-auto"
      >
        {/* Header Ribbon */}
        <div className="flex justify-between items-center border-b border-[#1a5c1a]/30 pb-2">
          <span className="font-bold text-[#00ff44] tracking-wider text-[9px] uppercase">
            {activeStep.title}
          </span>
          <span className="text-[8px] text-gray-500 font-bold bg-black/50 px-1.5 py-0.5 border border-green-950 rounded-[1.5px] select-none">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Technical Explainer Briefing Copy */}
        <p className="text-[9.5px] leading-relaxed text-gray-300 uppercase font-sans">
          {activeStep.copy}
        </p>

        {/* Dynamic Action suggestion cue based on selected target */}
        <div className="text-[7.5px] text-[#00e5ff] uppercase font-bold bg-cyan-950/15 border border-cyan-900/30 p-1 rounded-sm select-none">
          {activeStep.target === 'switcher' && '💡 workflow: Click split workstation to overlay maps.'}
          {activeStep.target === 'inspector' && '💡 workflow: select preset swarms to inspect regional bottlenecks.'}
          {activeStep.target === 'surface' && '💡 workflow: Toggle graph to examine individual treaty bonds.'}
          {activeStep.target === 'actions' && '💡 workflow: select a hostile state backer & execute Alt-S.'}
        </div>

        {/* Navigation / Progress Ribbon */}
        <div className="flex justify-between items-center pt-1">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[8px] text-gray-500 hover:text-red-400 font-bold uppercase transition-all tracking-wider selection:bg-transparent"
            title="Exit command tutorial"
          >
            ✕ Dismiss
          </button>

          <div className="flex gap-1">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2 py-0.5 bg-black hover:bg-[#113111] border border-[#1a5c1a]/50 text-gray-400 hover:text-white rounded-[1.5px] text-[8px] uppercase font-bold transition-all cursor-pointer"
              >
                ◀ Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-2.5 py-0.5 bg-[#153a15] hover:bg-[#1b4e1b] border border-[#00ff44]/75 text-[#00ff44] hover:text-white rounded-[1.5px] text-[8px] uppercase font-extrabold tracking-wide transition-all cursor-pointer shadow-[0_0_4px_rgba(0,255,68,0.25)]"
            >
              {currentStep === steps.length - 1 ? 'Acknowledge ✔' : 'Continue ▶'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
