"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Music, Zap, Globe, Download, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  children?: React.ReactNode;
}

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Amber Music",
    description: "Your music, elevated. A modern platform for discovering, playing, and organizing music.",
    icon: Music,
  },
  {
    id: "features",
    title: "Powerful Features",
    description: "Synced lyrics, offline downloads, playlist transfer, equalizer, Discord Rich Presence, and more.",
    icon: Zap,
  },
  {
    id: "sync",
    title: "Sync Everywhere",
    description: "Your library, playlists, and preferences sync across web and desktop automatically.",
    icon: Globe,
  },
  {
    id: "local",
    title: "Your Music, Your Way",
    description: "Add local files, import playlists from Spotify/YouTube, and organize everything in one place.",
    icon: Download,
  },
  {
    id: "complete",
    title: "You're Ready!",
    description: "Start exploring music. Press ⌘K to search, use media keys to control playback.",
    icon: Check,
  },
];

export function Onboarding({ isOpen, onComplete, children }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-text-muted mb-2">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                  animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <step.icon className="mx-auto h-16 w-16 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold text-text-primary mb-2">{step.title}</h2>
                <p className="text-text-muted">{step.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn("btn-secondary", currentStep === 0 && "opacity-50 pointer-events-none")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </button>
              <button
                onClick={nextStep}
                className="btn-primary"
                disabled={isLastStep}
              >
                {isLastStep ? "Get Started" : "Next"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function OnboardingWelcome({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        >
          <div className="p-8 text-center">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-6">
              <Music className="h-12 w-12 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Amber Music Platform</h1>
            <p className="text-text-muted mb-8">Your music, elevated. Welcome to a new way to experience music.</p>
            <button onClick={onComplete} className="btn-primary w-full py-3 text-lg">
              Get Started
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function OnboardingCompleteToast({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <motion.div
          className="glass-strong rounded-xl p-4 shadow-xl border border-border-primary flex items-center gap-3 max-w-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
            <Check className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-text-primary">Welcome to Amber Music!</p>
            <p className="text-sm text-text-muted">Press ⌘K to search, use media keys to control playback</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function KeychainNotice({ isOpen, onComplete }: { isOpen: boolean; onComplete: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-strong rounded-2xl max-w-md w-full shadow-2xl"
        >
          <div className="p-6 text-center">
            <div className="mx-auto h-16 w-16 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
              <Settings className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Keychain Access</h2>
            <p className="text-text-muted mb-6">
              Amber Music wants to securely store your session in the system keychain.
              This keeps you signed in across restarts.
            </p>
            <div className="space-y-2">
              <button onClick={onComplete} className="btn-primary w-full">
                Allow
              </button>
              <button onClick={onComplete} className="btn-secondary w-full">
                Not Now
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}