import { useState, useCallback } from 'react';
import { RegistrationData, ExperienceLevel, CommitmentTime, LearningStyle, LearningGoal } from '@/lib/registrationTypes';
import { generateLearningProfile, LearningProfile } from '@/lib/matchingEngine';

const TOTAL_STEPS = 7;

const initialData: RegistrationData = {
  skillTrack: null,
  experienceLevel: null,
  commitmentTime: null,
  learningStyle: null,
  learningGoal: null,
  personalGoal: '',
};

export function useRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<RegistrationData>(initialData);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateData = useCallback(<K extends keyof RegistrationData>(
    key: K,
    value: RegistrationData[K]
  ) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.skillTrack !== null;
      case 2:
        return data.experienceLevel !== null;
      case 3:
        return data.commitmentTime !== null;
      case 4:
        return data.learningStyle !== null;
      case 5:
        return data.learningGoal !== null;
      case 6:
        return true; // Personal goal is optional
      case 7:
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  const nextStep = useCallback(async () => {
    if (currentStep < TOTAL_STEPS && canProceed()) {
      if (currentStep === 6) {
        // Generate learning profile before showing final step
        setIsGenerating(true);
        // Simulate AI processing delay for effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        const profile = generateLearningProfile(data);
        setLearningProfile(profile);
        setIsGenerating(false);
      }
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, canProceed, data]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setData(initialData);
    setLearningProfile(null);
  }, []);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    data,
    learningProfile,
    isGenerating,
    progress,
    updateData,
    canProceed,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
