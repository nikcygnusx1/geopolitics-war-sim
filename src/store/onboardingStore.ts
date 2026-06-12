import { create } from 'zustand';

export interface OnboardingStep {
  target: 'switcher' | 'inspector' | 'surface' | 'actions';
  title: string;
  copy: string;
  highlightSelector: string;
  alignment: 'bottom' | 'right' | 'top-left' | 'left';
}

interface OnboardingState {
  isOnboardingActive: boolean;
  currentStep: number;
  isDismissed: boolean;
  steps: OnboardingStep[];
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  startOnboarding: () => void;
  dismissOnboarding: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    target: 'switcher',
    title: '🛰️ CHOOSE YOUR CONTEXT',
    copy: 'Begin by navigating the Globe or Relation Graph. Switch overlays to reveal specific vectors like nuclear alerts, conflict hubs, or financial pressure paths.',
    highlightSelector: '[data-testid="onboarding-switcher"]',
    alignment: 'bottom'
  },
  {
    target: 'inspector',
    title: '📋 OPERATIONS AI BREIFING',
    copy: 'Here is your active intelligence deck. Consult the Operations AI tab to view real-time crisis alerts and tactical threats. Select an alert to open direct operational actions.',
    highlightSelector: '[data-testid="onboarding-inspector"]',
    alignment: 'right'
  },
  {
    target: 'surface',
    title: '🗺️ TRACE THE FIELD',
    copy: 'Inspect the primary theater canvas. In Relation Graph mode, you trace defensive pacts, economic reliance, and hostile corridors directly. Hover and trace connection lines here.',
    highlightSelector: '[data-testid="onboarding-surface"]',
    alignment: 'top-left'
  },
  {
    target: 'actions',
    title: '⚡ SOVEREIGN COMMAND DECISIONS',
    copy: 'Sovereign intervention suite. Use Diplomacy (F4) for trade leverage and defensive alignments. Open Arsenal (F3) to build up forces or launch precision strikes, and use other hotkeys to manage national stress.',
    highlightSelector: '[data-testid="onboarding-actions"]',
    alignment: 'left'
  }
];

// Read initial state safely
const isCompletedInStorage = (): boolean => {
  try {
    return localStorage.getItem('sovereign_onboarding_completed') === 'true';
  } catch {
    return false;
  }
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOnboardingActive: !isCompletedInStorage(),
  currentStep: 0,
  isDismissed: false,
  steps: ONBOARDING_STEPS,

  setStep: (step) => {
    if (step >= 0 && step < ONBOARDING_STEPS.length) {
      set({ currentStep: step });
    }
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().dismissOnboarding();
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  startOnboarding: () => {
    set({ isOnboardingActive: true, currentStep: 0 });
  },

  dismissOnboarding: () => {
    try {
      localStorage.setItem('sovereign_onboarding_completed', 'true');
    } catch (e) {
      // Ignored in sandboxed file iframe
    }
    set({ isOnboardingActive: false });
  }
}));
