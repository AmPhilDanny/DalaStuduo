import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'skillbridge_tour_completed';

interface Step {
  title: string;
  description: string;
}

const DEFAULT_STEPS: Step[] = [
  {
    title: 'Welcome to SkillBridge',
    description:
      'Browse jobs, connect with talent, and grow your career — all in one place.',
  },
  {
    title: 'Find Opportunities',
    description:
      'Use the marketplace to discover internships, part-time work, and projects that match your skills.',
  },
  {
    title: 'Stay Connected',
    description:
      'Message employers, track your applications, manage your orders, and grow your professional network.',
  },
];

interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function useTour(steps: Step[] = DEFAULT_STEPS): TourState {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Auto-show on first visit after a short delay
      const timer = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    startTour,
    endTour,
    nextStep,
    prevStep,
  };
}

interface TourOverlayProps {
  steps?: Step[];
}

export default function TourOverlay({ steps = DEFAULT_STEPS }: TourOverlayProps) {
  const { isActive, currentStep, totalSteps, endTour, nextStep, prevStep } = useTour(steps);

  if (!isActive) return null;

  const step = steps[currentStep];
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={endTour}
          className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentStep ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold">{currentStep + 1}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={endTour}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-lg shadow-purple-600/20"
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
