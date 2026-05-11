import { 
  RegistrationData, 
  PersonaType, 
  SkillTrack, 
  ExperienceLevel, 
  CommitmentTime, 
  LearningStyle, 
  LearningGoal 
} from './registrationTypes';

// Roadmap mapping
const ROADMAP_MAP: Record<SkillTrack, string> = {
  full_stack: 'Full-Stack Development Roadmap',
  ui_ux: 'UI/UX Design Roadmap',
  video_editing: 'Video Production Roadmap',
  ai_ml: 'AI Engineering Roadmap',
  graphic_design: 'Graphic Design Roadmap',
  cybersecurity: 'Cybersecurity Basics Roadmap',
  mobile_dev: 'React Native Development Roadmap',
  data_science: 'Data Science Roadmap',
  cloud_devops: 'Cloud & DevOps Roadmap',
};

// Starting stage mapping
const STARTING_STAGE_MAP: Record<ExperienceLevel, string> = {
  beginner: 'Awareness Stage',
  basic: 'Beginner Stage',
  intermediate: 'Intermediate Stage',
  advanced: 'Advanced/Proficient Stage',
};

// Lesson length mapping
const LESSON_LENGTH_MAP: Record<CommitmentTime, string> = {
  '15_30_mins': 'Micro-lessons (5-10 min each)',
  '1_hour': 'Standard lessons (15-20 min each)',
  '2_3_hours': 'Deep lessons + projects (30-45 min each)',
  '4_plus_hours': 'Fast-track mode (intensive modules)',
};

// Content priority mapping
const CONTENT_PRIORITY_MAP: Record<LearningStyle, string> = {
  videos: 'Video-first lessons',
  text_notes: 'Document-based lessons',
  project_based: 'Hands-on project tasks',
  short_explanations: 'Summaries + quizzes',
  step_by_step: 'Guided walkthrough lessons',
};

// Project recommendation mapping
const PROJECT_RECOMMENDATION_MAP: Record<LearningGoal, string> = {
  get_job: 'Real-world portfolio projects',
  build_project: 'Capstone project early',
  freelance: 'Client-ready project templates',
  startup: 'Product-building lessons',
  learn_for_fun: 'Light + enjoyable experiments',
};

// Determine persona based on answers
export function determinePersona(data: RegistrationData): PersonaType {
  const { skillTrack, experienceLevel, commitmentTime, learningStyle, learningGoal } = data;

  // The Innovator: Startup goal + AI/ML track
  if (learningGoal === 'startup' && skillTrack === 'ai_ml') {
    return 'innovator';
  }

  // The Fast-Tracker: 4+ hours daily
  if (commitmentTime === '4_plus_hours') {
    return 'fast_tracker';
  }

  // The Builder: Project-based learning + build project goal + intermediate+
  if (
    learningStyle === 'project_based' &&
    learningGoal === 'build_project' &&
    (experienceLevel === 'intermediate' || experienceLevel === 'advanced')
  ) {
    return 'builder';
  }

  // The Visual Learner: Video + design skills
  if (
    learningStyle === 'videos' &&
    (skillTrack === 'ui_ux' || skillTrack === 'graphic_design' || skillTrack === 'video_editing')
  ) {
    return 'visual_learner';
  }

  // The Analyst: Step-by-step + coding/data tracks
  if (
    learningStyle === 'step_by_step' &&
    (skillTrack === 'full_stack' || skillTrack === 'data_science' || skillTrack === 'ai_ml')
  ) {
    return 'analyst';
  }

  // The Explorer: Beginner + fun learning
  if (experienceLevel === 'beginner' && learningGoal === 'learn_for_fun') {
    return 'explorer';
  }

  // Default fallback based on primary characteristics
  if (learningStyle === 'project_based') return 'builder';
  if (learningStyle === 'videos') return 'visual_learner';
  if (learningStyle === 'step_by_step') return 'analyst';
  if (learningGoal === 'startup') return 'innovator';
  if (commitmentTime === '2_3_hours') return 'fast_tracker';
  
  return 'explorer';
}

// Sample lessons database
interface Lesson {
  id: string;
  title: string;
  category: SkillTrack;
  level: ExperienceLevel;
  style: LearningStyle;
  goalRelevance: LearningGoal[];
  duration: number; // in minutes
}

const SAMPLE_LESSONS: Lesson[] = [
  // Full Stack
  { id: 'fs-1', title: 'Introduction to Web Development', category: 'full_stack', level: 'beginner', style: 'videos', goalRelevance: ['get_job', 'build_project'], duration: 15 },
  { id: 'fs-2', title: 'HTML & CSS Fundamentals', category: 'full_stack', level: 'beginner', style: 'step_by_step', goalRelevance: ['get_job', 'learn_for_fun'], duration: 20 },
  { id: 'fs-3', title: 'JavaScript Basics', category: 'full_stack', level: 'basic', style: 'project_based', goalRelevance: ['get_job', 'build_project'], duration: 25 },
  { id: 'fs-4', title: 'React Fundamentals', category: 'full_stack', level: 'intermediate', style: 'project_based', goalRelevance: ['get_job', 'startup'], duration: 30 },
  { id: 'fs-5', title: 'Building REST APIs', category: 'full_stack', level: 'intermediate', style: 'step_by_step', goalRelevance: ['get_job', 'freelance'], duration: 35 },
  
  // UI/UX
  { id: 'ux-1', title: 'Design Thinking Basics', category: 'ui_ux', level: 'beginner', style: 'videos', goalRelevance: ['get_job', 'learn_for_fun'], duration: 15 },
  { id: 'ux-2', title: 'Figma Essentials', category: 'ui_ux', level: 'beginner', style: 'step_by_step', goalRelevance: ['get_job', 'freelance'], duration: 20 },
  { id: 'ux-3', title: 'User Research Methods', category: 'ui_ux', level: 'basic', style: 'text_notes', goalRelevance: ['get_job', 'startup'], duration: 25 },
  { id: 'ux-4', title: 'Prototyping Masterclass', category: 'ui_ux', level: 'intermediate', style: 'project_based', goalRelevance: ['freelance', 'build_project'], duration: 40 },
  
  // AI/ML
  { id: 'ai-1', title: 'Introduction to AI', category: 'ai_ml', level: 'beginner', style: 'videos', goalRelevance: ['learn_for_fun', 'get_job'], duration: 15 },
  { id: 'ai-2', title: 'Python for Data Science', category: 'ai_ml', level: 'basic', style: 'step_by_step', goalRelevance: ['get_job', 'startup'], duration: 25 },
  { id: 'ai-3', title: 'Machine Learning Basics', category: 'ai_ml', level: 'intermediate', style: 'project_based', goalRelevance: ['startup', 'get_job'], duration: 35 },
  { id: 'ai-4', title: 'Building AI Products', category: 'ai_ml', level: 'advanced', style: 'project_based', goalRelevance: ['startup', 'freelance'], duration: 45 },
  
  // Add more categories...
  { id: 've-1', title: 'Video Editing Fundamentals', category: 'video_editing', level: 'beginner', style: 'videos', goalRelevance: ['freelance', 'learn_for_fun'], duration: 20 },
  { id: 'gd-1', title: 'Graphic Design Principles', category: 'graphic_design', level: 'beginner', style: 'videos', goalRelevance: ['freelance', 'learn_for_fun'], duration: 20 },
  { id: 'cs-1', title: 'Cybersecurity Fundamentals', category: 'cybersecurity', level: 'beginner', style: 'text_notes', goalRelevance: ['get_job', 'learn_for_fun'], duration: 25 },
  { id: 'md-1', title: 'Mobile App Development Intro', category: 'mobile_dev', level: 'beginner', style: 'videos', goalRelevance: ['build_project', 'startup'], duration: 20 },
  { id: 'ds-1', title: 'Data Analysis Basics', category: 'data_science', level: 'beginner', style: 'step_by_step', goalRelevance: ['get_job', 'learn_for_fun'], duration: 25 },
  { id: 'cd-1', title: 'Cloud Computing Overview', category: 'cloud_devops', level: 'beginner', style: 'videos', goalRelevance: ['get_job', 'startup'], duration: 20 },
];

// Calculate match score for a lesson
function calculateMatchScore(lesson: Lesson, data: RegistrationData): number {
  let score = 0;

  // Skill relevance (40%)
  if (lesson.category === data.skillTrack) {
    score += 0.4;
  }

  // Level fit (20%)
  const levelOrder: ExperienceLevel[] = ['beginner', 'basic', 'intermediate', 'advanced'];
  const userLevelIndex = levelOrder.indexOf(data.experienceLevel!);
  const lessonLevelIndex = levelOrder.indexOf(lesson.level);
  
  if (lessonLevelIndex <= userLevelIndex && lessonLevelIndex >= userLevelIndex - 1) {
    score += 0.2;
  } else if (lessonLevelIndex === userLevelIndex + 1) {
    score += 0.1; // Slightly challenging is okay
  }

  // Learning style fit (20%)
  if (lesson.style === data.learningStyle) {
    score += 0.2;
  }

  // Goal match (20%)
  if (lesson.goalRelevance.includes(data.learningGoal!)) {
    score += 0.2;
  }

  return score;
}

// Get recommended lessons
export function getRecommendedLessons(data: RegistrationData, count: number = 5): { lesson: Lesson; score: number }[] {
  const scoredLessons = SAMPLE_LESSONS
    .map(lesson => ({
      lesson,
      score: calculateMatchScore(lesson, data),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return scoredLessons;
}

// Sample projects database
interface Project {
  id: string;
  title: string;
  description: string;
  category: SkillTrack;
  difficulty: ExperienceLevel;
  goals: LearningGoal[];
}

const SAMPLE_PROJECTS: Project[] = [
  { id: 'p1', title: 'Personal Portfolio Website', description: 'Build a stunning portfolio to showcase your work', category: 'full_stack', difficulty: 'basic', goals: ['get_job', 'freelance'] },
  { id: 'p2', title: 'E-commerce Store', description: 'Create a fully functional online store', category: 'full_stack', difficulty: 'intermediate', goals: ['startup', 'freelance'] },
  { id: 'p3', title: 'Mobile App UI Kit', description: 'Design a complete mobile app interface', category: 'ui_ux', difficulty: 'intermediate', goals: ['freelance', 'build_project'] },
  { id: 'p4', title: 'AI Chatbot', description: 'Build an intelligent conversational agent', category: 'ai_ml', difficulty: 'intermediate', goals: ['startup', 'build_project'] },
  { id: 'p5', title: 'Brand Identity Package', description: 'Create a complete brand identity system', category: 'graphic_design', difficulty: 'basic', goals: ['freelance', 'build_project'] },
  { id: 'p6', title: 'YouTube Video Series', description: 'Produce and edit a video content series', category: 'video_editing', difficulty: 'basic', goals: ['freelance', 'learn_for_fun'] },
  { id: 'p7', title: 'Security Audit Tool', description: 'Build a security scanning application', category: 'cybersecurity', difficulty: 'intermediate', goals: ['get_job', 'build_project'] },
  { id: 'p8', title: 'Cross-Platform App', description: 'Develop an app for iOS and Android', category: 'mobile_dev', difficulty: 'intermediate', goals: ['startup', 'build_project'] },
  { id: 'p9', title: 'Data Dashboard', description: 'Create interactive data visualizations', category: 'data_science', difficulty: 'intermediate', goals: ['get_job', 'startup'] },
  { id: 'p10', title: 'CI/CD Pipeline', description: 'Set up automated deployment workflows', category: 'cloud_devops', difficulty: 'intermediate', goals: ['get_job', 'startup'] },
];

// Get recommended projects
export function getRecommendedProjects(data: RegistrationData, count: number = 3): Project[] {
  return SAMPLE_PROJECTS
    .filter(project => {
      const categoryMatch = project.category === data.skillTrack;
      const goalMatch = project.goals.includes(data.learningGoal!);
      return categoryMatch || goalMatch;
    })
    .sort((a, b) => {
      const aScore = (a.category === data.skillTrack ? 1 : 0) + (a.goals.includes(data.learningGoal!) ? 1 : 0);
      const bScore = (b.category === data.skillTrack ? 1 : 0) + (b.goals.includes(data.learningGoal!) ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, count);
}

// Generate complete learning profile
export interface LearningProfile {
  persona: PersonaType;
  roadmap: string;
  startingStage: string;
  lessonLength: string;
  contentPriority: string;
  projectRecommendation: string;
  recommendedLessons: { lesson: Lesson; score: number }[];
  recommendedProjects: Project[];
  dailyPlan: string;
  aiSummary: string;
}

export function generateLearningProfile(data: RegistrationData): LearningProfile {
  const persona = determinePersona(data);
  const recommendedLessons = getRecommendedLessons(data);
  const recommendedProjects = getRecommendedProjects(data);

  // Generate daily plan based on commitment time
  const dailyPlanMap: Record<CommitmentTime, string> = {
    '15_30_mins': '1 micro-lesson + 1 quick quiz daily',
    '1_hour': '2-3 standard lessons + practice exercises',
    '2_3_hours': '4-5 deep lessons + 1 project session',
    '4_plus_hours': 'Intensive learning: 6+ lessons + hands-on project work',
  };

  // Generate AI summary
  const skillLabel = ROADMAP_MAP[data.skillTrack!];
  const goalLabels: Record<LearningGoal, string> = {
    get_job: 'landing your dream job',
    build_project: 'building your project',
    freelance: 'starting your freelance career',
    startup: 'launching your startup',
    learn_for_fun: 'exploring and enjoying the journey',
  };

  const aiSummary = `Based on your preferences, we've crafted a personalized ${skillLabel} journey for you. You'll start at the ${STARTING_STAGE_MAP[data.experienceLevel!]} with ${CONTENT_PRIORITY_MAP[data.learningStyle!].toLowerCase()}. Your path is optimized for ${goalLabels[data.learningGoal!]}. ${data.personalGoal ? `We noted your goal: "${data.personalGoal}" and will tailor your experience accordingly.` : ''}`;

  return {
    persona,
    roadmap: ROADMAP_MAP[data.skillTrack!],
    startingStage: STARTING_STAGE_MAP[data.experienceLevel!],
    lessonLength: LESSON_LENGTH_MAP[data.commitmentTime!],
    contentPriority: CONTENT_PRIORITY_MAP[data.learningStyle!],
    projectRecommendation: PROJECT_RECOMMENDATION_MAP[data.learningGoal!],
    recommendedLessons,
    recommendedProjects,
    dailyPlan: dailyPlanMap[data.commitmentTime!],
    aiSummary,
  };
}
