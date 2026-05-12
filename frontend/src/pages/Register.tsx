import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { ProgressBar } from "@/components/registration/ProgressBar";
import { StepContainer } from "@/components/registration/StepContainer";
import axios from "axios";
import { SkillTrackStep } from "@/components/registration/SkillTrackStep";
import { ExperienceLevelStep } from "@/components/registration/ExperienceLevelStep";
import { CommitmentTimeStep } from "@/components/registration/CommitmentTimeStep";
import { LearningStyleStep } from "@/components/registration/LearningStyleStep";
import { LearningGoalStep } from "@/components/registration/LearningGoalStep";
import { PersonalGoalStep } from "@/components/registration/PersonalGoalStep";
import { PersonaRevealStep } from "@/components/registration/PersonaRevealStep";

import { NavigationButtons } from "@/components/registration/NavigationButtons";
import { useRegistration } from "@/hooks/useRegistration";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);

  const {
    currentStep,
    totalSteps,
    data,
    learningProfile,
    isGenerating,
    progress,
    updateData,
    canProceed,
    nextStep,
    prevStep,
  } = useRegistration();

  /* =============================
      COMPLETE REGISTRATION
     ============================= */

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast({
          title: "Unauthorized",
          description: "Please login again.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.post(
        "http://localhost:5001/api/users/onboarding",
        {
          ...data,
          ...learningProfile,
          // skillTrack is now the course title selected from DB
          skillTrack: data.skillTrack,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update localStorage user with the course data returned from onboarding
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (response.data?.course) {
        storedUser.learningProfile = {
          ...(storedUser.learningProfile || {}),
          course: response.data.course,
          skillTrack: data.skillTrack,
        };
        storedUser.onboardingCompleted = true;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }

      toast({
        title: "Success 🎉",
        description: response.data?.course
          ? `Profile completed! Enrolled in ${response.data.course.title}.`
          : "Profile completed successfully!",
      });

      navigate("/dashboard");

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong!",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* =============================
      STEP CONTENT
     ============================= */

  const stepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContainer
            stepKey={1}
            title="Choose Your Skill Track"
            subtitle="What do you want to master?"
          >
            <SkillTrackStep
              selected={data.skillTrack}
              onSelect={(skill) => updateData("skillTrack", skill)}
            />
          </StepContainer>
        );

      case 2:
        return (
          <StepContainer
            stepKey={2}
            title="Your Experience Level"
            subtitle="Where are you in your journey?"
          >
            <ExperienceLevelStep
              selected={data.experienceLevel}
              onSelect={(level) =>
                updateData("experienceLevel", level)
              }
            />
          </StepContainer>
        );

      case 3:
        return (
          <StepContainer
            stepKey={3}
            title="Daily Commitment"
            subtitle="How much time per day?"
          >
            <CommitmentTimeStep
              selected={data.commitmentTime}
              onSelect={(time) =>
                updateData("commitmentTime", time)
              }
            />
          </StepContainer>
        );

      case 4:
        return (
          <StepContainer
            stepKey={4}
            title="Learning Style"
            subtitle="How do you learn best?"
          >
            <LearningStyleStep
              selected={data.learningStyle}
              onSelect={(style) =>
                updateData("learningStyle", style)
              }
            />
          </StepContainer>
        );

      case 5:
        return (
          <StepContainer
            stepKey={5}
            title="Main Goal"
            subtitle="What motivates you?"
          >
            <LearningGoalStep
              selected={data.learningGoal}
              onSelect={(goal) =>
                updateData("learningGoal", goal)
              }
            />
          </StepContainer>
        );

      case 6:
        return (
          <StepContainer
            stepKey={6}
            title="Personal Vision"
            subtitle="Tell us more"
          >
            <PersonalGoalStep
              value={data.personalGoal}
              onChange={(value) =>
                updateData("personalGoal", value)
              }
            />
          </StepContainer>
        );

      case 7:
        return (
          <StepContainer
            stepKey={7}
            title="Your Learning Persona"
            subtitle="Your personalized path"
          >
            {learningProfile && (
              <PersonaRevealStep
                profile={learningProfile}
                isGenerating={isGenerating}
              />
            )}
          </StepContainer>
        );

      default:
        return null;
    }
  };

  /* =============================
      MAIN UI
     ============================= */

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background */}
      <ParticlesBackground />

      {/* Floating Orbs */}
      <motion.div
        className="fixed top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <motion.div
        className="fixed bottom-20 right-10 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-6"
        >
          <div className="max-w-4xl mx-auto flex justify-between items-center">

            <h1 className="text-xl font-bold">
              <span className="text-gradient">PathMentor</span>{" "}
              <span className="text-primary">AI</span>
            </h1>

            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>

          </div>
        </motion.header>

        {/* Progress */}
        <div className="px-6 mb-8">
          <ProgressBar
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 px-6 pb-8 flex flex-col">

          <div className="flex-1 flex items-center justify-center">
            {stepContent()}
          </div>

          {/* Navigation */}
          <NavigationButtons
            currentStep={currentStep}
            totalSteps={totalSteps}
            canProceed={canProceed()}
            isGenerating={isGenerating || isSaving}
            onPrev={prevStep}
            onNext={nextStep}
            onComplete={handleComplete}
          />

        </main>

      </div>
    </div>
  );
};

export default Register;
