import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Standard Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Roadmap from "./pages/Roadmap";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import Lessons from "./pages/Lessons";
import BrowseCourses from "./pages/BrowseCourses";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Announcements from "./pages/Announcements";
import StudyBuddies from "./pages/StudyBuddies";
import Sessions from "./pages/Sessions";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import VideoRoom from "./pages/VideoRoom";
import StudentProjects from "./pages/StudentProjects";
import StudyRooms from "./pages/StudyRooms";
import StudyRoomDetail from "./pages/StudyRoomDetail";
import ProgressPage from "./pages/ProgressPage";
import SupportPage from "./pages/SupportPage";

// Mentor Pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorPendingApproval from "./pages/mentor/MentorPendingApproval";
import MentorClasses from "./pages/mentor/MyClasses";
import MentorClassDetails from "./pages/mentor/ClassDetails";
import MentorCourseAnalysis from "./pages/mentor/CourseAnalysis";
import ClassUpload from "./pages/mentor/ClassUpload";
import MentorTaskBuilder from "./pages/mentor/MentorTaskBuilder";
import MentorReviewQueue from "./pages/mentor/MentorReviewQueue";
import MentorSessions from "./pages/mentor/MentorSessions";
import MentorAnnouncements from "./pages/mentor/MentorAnnouncements";
import MentorProjects from "./pages/mentor/MentorProjects";
import MentorSettings from "./pages/mentor/MentorSettings";
import MentorChat from "./pages/mentor/MentorChat";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Activities from "./pages/admin/Activities";

// Admin Mentor
import AllMentors from "./pages/admin/mentors/AllMentors";
import MentorApplications from "./pages/admin/mentors/MentorApplications";
import MentorPerformance from "./pages/admin/mentors/MentorPerformance";
import MentorReviews from "./pages/admin/mentors/MentorReviews";

// Admin Student
import AllStudents from "./pages/admin/students/AllStudents";
import StudentEnrollments from "./pages/admin/students/StudentEnrollments";
import StudentProgress from "./pages/admin/students/StudentProgress";
import GradesStatus from "./pages/admin/students/GradesStatus";
import StudentReports from "./pages/admin/students/StudentReports";

// Admin Courses
import AdminCourses from "./pages/admin/courses/AdminCourses";
import AdminCategories from "./pages/admin/courses/AdminCategories";
import AdminLessons from "./pages/admin/courses/AdminLessons";
import AdminReviews from "./pages/admin/courses/AdminReviews";
import AdminAssignments from "./pages/admin/courses/AdminAssignments";

// Chats
import SupportTickets from "./pages/admin/chats/SupportTickets";
import AdminChatPage from "./pages/admin/AdminChatPage";

// Feedback
import AllFeedback from "./pages/admin/feedback/AllFeedback";
// FeedbackReports and Ratings removed

// Settings
import SystemSettings from "./pages/admin/settings/SystemSettings";
import ProfileSettings from "./pages/admin/settings/ProfileSettings";

// Announcements & Leaderboard
import AdminAnnouncements from "./pages/admin/announcements/AdminAnnouncements";
import AdminLeaderboard from "./pages/admin/leaderboard/AdminLeaderboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />

        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* STUDENT */}
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/courses" element={<BrowseCourses />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/study-buddies" element={<StudyBuddies />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/room/:id" element={<VideoRoom />} />
            <Route path="/projects" element={<StudentProjects />} />
            <Route path="/study-rooms" element={<StudyRooms />} />
            <Route path="/study-rooms/:id" element={<StudyRoomDetail />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/support" element={<SupportPage />} />

            {/* MENTOR */}
            <Route path="/mentor/pending" element={<MentorPendingApproval />} />
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/mentor/task/:id" element={<MentorTaskBuilder />} />
            <Route path="/mentor/review" element={<MentorReviewQueue />} />
            <Route path="/mentor/sessions" element={<MentorSessions />} />
            <Route path="/mentor/chat" element={<MentorChat />} />
            <Route path="/mentor/announcements" element={<MentorAnnouncements />} />
            <Route path="/mentor/projects" element={<MentorProjects />} />
            <Route path="/mentor/settings" element={<MentorSettings />} />

            {/* MENTOR CLASSES */}
            <Route path="/mentor/classes" element={<MentorClasses />} />
            <Route path="/mentor/class/:id" element={<MentorClassDetails />} />
            <Route path="/mentor/upload/:id" element={<ClassUpload />} />

            {/* ANALYSIS PAGE */}
            <Route path="/mentor/analysis/:id" element={<MentorCourseAnalysis />} />



            {/* ADMIN */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="activities" element={<Activities />} />

              {/* Mentors */}
              <Route path="mentors" element={<AllMentors />} />
              <Route path="applications" element={<MentorApplications />} />
              <Route path="performance" element={<MentorPerformance />} />
              <Route path="mentor-reviews" element={<MentorReviews />} />

              {/* Students */}
              <Route path="allstudents" element={<AllStudents />} />
              <Route path="enrollments" element={<StudentEnrollments />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="grades" element={<GradesStatus />} />
              <Route path="reports" element={<StudentReports />} />

              {/* Courses */}
              <Route path="all-courses" element={<AdminCourses />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="lessons" element={<AdminLessons />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="assignments" element={<AdminAssignments />} />

              {/* Chats */}
              <Route path="user-chat" element={<AdminChatPage />} />
              <Route path="tickets" element={<SupportTickets />} />

              {/* Feedback */}
              <Route path="feedback" element={<AllFeedback />} />

              {/* Settings */}
              <Route path="settings/profile" element={<ProfileSettings />} />
              <Route path="settings/system" element={<SystemSettings />} />

              {/* Announcements & Leaderboard */}
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;