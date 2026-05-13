export interface Lesson {
    _id: string;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    thumbnail_url?: string;
    category: string;
    duration_minutes: number;
    experience_level: string;
}

export interface LessonProgress {
    _id?: string;
    lesson_id: string;
    user_id: string;
    is_completed: boolean;
    video_progress_seconds?: number;
    quiz_completed?: boolean;
    quiz_score?: number;
    last_watched_at?: string;
}

export interface LessonQuiz {
    _id: string;
    lesson_id: string;
    question: string;
    options: string[];
    correct_answer_index: number;
    explanation?: string;
}
