// Registration Types and Constants

export type SkillTrack = 
  | 'full_stack' 
  | 'ui_ux' 
  | 'video_editing' 
  | 'ai_ml' 
  | 'graphic_design' 
  | 'cybersecurity' 
  | 'mobile_dev' 
  | 'data_science' 
  | 'cloud_devops';

export type ExperienceLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced';

export type CommitmentTime = '15_30_mins' | '1_hour' | '2_3_hours' | '4_plus_hours';

export type LearningStyle = 'videos' | 'text_notes' | 'project_based' | 'short_explanations' | 'step_by_step';

export type LearningGoal = 'get_job' | 'build_project' | 'freelance' | 'startup' | 'learn_for_fun';

export type PersonaType = 'builder' | 'explorer' | 'fast_tracker' | 'visual_learner' | 'analyst' | 'innovator';

export interface RegistrationData {
  skillTrack: SkillTrack | null;
  experienceLevel: ExperienceLevel | null;
  commitmentTime: CommitmentTime | null;
  learningStyle: LearningStyle | null;
  learningGoal: LearningGoal | null;
  personalGoal: string;
}

export interface SkillOption {
  id: SkillTrack;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const SKILL_OPTIONS: SkillOption[] = [
  { id: 'full_stack', label: 'Full-Stack Coding', icon: '💻', description: 'Build complete web applications', color: 'from-blue-500 to-cyan-400' },
  { id: 'ui_ux', label: 'UI/UX Design', icon: '🎨', description: 'Create beautiful user experiences', color: 'from-pink-500 to-rose-400' },
  { id: 'video_editing', label: 'Video Editing', icon: '🎬', description: 'Master video production', color: 'from-red-500 to-orange-400' },
  { id: 'ai_ml', label: 'AI & Machine Learning', icon: '🤖', description: 'Build intelligent systems', color: 'from-purple-500 to-violet-400' },
  { id: 'graphic_design', label: 'Graphic Design', icon: '✏️', description: 'Create stunning visuals', color: 'from-amber-500 to-yellow-400' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔐', description: 'Protect digital assets', color: 'from-green-500 to-emerald-400' },
  { id: 'mobile_dev', label: 'Mobile Development', icon: '📱', description: 'Build mobile apps', color: 'from-indigo-500 to-blue-400' },
  { id: 'data_science', label: 'Data Science', icon: '📊', description: 'Analyze and visualize data', color: 'from-teal-500 to-cyan-400' },
  { id: 'cloud_devops', label: 'Cloud & DevOps', icon: '☁️', description: 'Master cloud infrastructure', color: 'from-slate-500 to-gray-400' },
];

export interface ExperienceOption {
  id: ExperienceLevel;
  label: string;
  description: string;
}

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'beginner', label: 'Beginner', description: "I'm completely new to this" },
  { id: 'basic', label: 'Basic', description: 'I know some fundamentals' },
  { id: 'intermediate', label: 'Intermediate', description: 'I have hands-on experience' },
  { id: 'advanced', label: 'Advanced', description: "I'm quite proficient" },
];

export interface CommitmentOption {
  id: CommitmentTime;
  label: string;
  description: string;
  icon: string;
}

export const COMMITMENT_OPTIONS: CommitmentOption[] = [
  { id: '15_30_mins', label: '15–30 minutes', description: 'Quick daily sessions', icon: '⚡' },
  { id: '1_hour', label: '1 hour', description: 'Focused learning time', icon: '⏱️' },
  { id: '2_3_hours', label: '2–3 hours', description: 'Deep dive sessions', icon: '📚' },
  { id: '4_plus_hours', label: '4+ hours', description: 'Intensive learning', icon: '🚀' },
];

export interface LearningStyleOption {
  id: LearningStyle;
  label: string;
  description: string;
  icon: string;
}

export const LEARNING_STYLE_OPTIONS: LearningStyleOption[] = [
  { id: 'videos', label: 'Videos', description: 'Watch and learn visually', icon: '🎥' },
  { id: 'text_notes', label: 'Text + Notes', description: 'Read detailed explanations', icon: '📝' },
  { id: 'project_based', label: 'Project-Based', description: 'Learn by building', icon: '🔨' },
  { id: 'short_explanations', label: 'Short Explanations', description: 'Quick, concise lessons', icon: '💡' },
  { id: 'step_by_step', label: 'Step-by-Step', description: 'Guided walkthrough', icon: '👣' },
];

export interface GoalOption {
  id: LearningGoal;
  label: string;
  description: string;
  icon: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: 'get_job', label: 'Get a Job', description: 'Land your dream role', icon: '💼' },
  { id: 'build_project', label: 'Build a Project', description: 'Create something amazing', icon: '🏗️' },
  { id: 'freelance', label: 'Freelance', description: 'Work independently', icon: '🎯' },
  { id: 'startup', label: 'Start a Startup', description: 'Launch your business', icon: '🚀' },
  { id: 'learn_for_fun', label: 'Learn for Fun', description: 'Explore and enjoy', icon: '🎮' },
];

export interface PersonaInfo {
  type: PersonaType;
  name: string;
  title: string;
  description: string;
  emoji: string;
  traits: string[];
  color: string;
}

export const PERSONAS: Record<PersonaType, PersonaInfo> = {
  builder: {
    type: 'builder',
    name: 'The Builder',
    title: 'Hands-On Creator',
    description: 'You learn best by creating. Projects and practical exercises are your jam!',
    emoji: '🔨',
    traits: ['Project-focused', 'Practical', 'Results-driven'],
    color: 'from-orange-500 to-amber-400',
  },
  explorer: {
    type: 'explorer',
    name: 'The Explorer',
    title: 'Curious Adventurer',
    description: 'Your curiosity drives you to discover new things at your own pace.',
    emoji: '🧭',
    traits: ['Curious', 'Self-paced', 'Broad interests'],
    color: 'from-emerald-500 to-teal-400',
  },
  fast_tracker: {
    type: 'fast_tracker',
    name: 'The Fast-Tracker',
    title: 'Accelerated Learner',
    description: 'You want to master skills quickly with intensive, focused learning.',
    emoji: '⚡',
    traits: ['Ambitious', 'Dedicated', 'Goal-oriented'],
    color: 'from-yellow-500 to-orange-400',
  },
  visual_learner: {
    type: 'visual_learner',
    name: 'The Visual Learner',
    title: 'Design Enthusiast',
    description: 'You absorb information best through videos and visual content.',
    emoji: '🎨',
    traits: ['Visual', 'Creative', 'Detail-oriented'],
    color: 'from-pink-500 to-rose-400',
  },
  analyst: {
    type: 'analyst',
    name: 'The Analyst',
    title: 'Methodical Thinker',
    description: 'You prefer structured, step-by-step learning with clear progression.',
    emoji: '🔬',
    traits: ['Analytical', 'Structured', 'Thorough'],
    color: 'from-blue-500 to-indigo-400',
  },
  innovator: {
    type: 'innovator',
    name: 'The Innovator',
    title: 'Future Builder',
    description: 'You dream big and want to create products that change the world.',
    emoji: '💡',
    traits: ['Visionary', 'Entrepreneurial', 'Creative'],
    color: 'from-purple-500 to-violet-400',
  },
};
