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
import OnboardingPersona from "./pages/OnboardingPersona";
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
import SocialChat from "./pages/SocialChat";
import SessionDetail from "./pages/SessionDetail";

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
import StudentPerformance from "./pages/mentor/StudentPerformance";

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

import AuthGuard from "./components/auth/AuthGuard";
import useInactivityLogout from "./hooks/useInactivityLogout";

const queryClient = new QueryClient();

const App = () => {
  // Global inactivity tracking (20 mins)
  useInactivityLogout(20);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />

          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* STUDENT DASHBOARD - Protected */}
            <Route path="/dashboard" element={<AuthGuard allowedRoles={["student"]}><Dashboard /></AuthGuard>} />
            <Route path="/onboarding-persona" element={<AuthGuard allowedRoles={["student"]}><OnboardingPersona /></AuthGuard>} />
            <Route path="/roadmap" element={<AuthGuard allowedRoles={["student"]}><Roadmap /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard allowedRoles={["student", "mentor", "admin"]}><ProfilePage /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard allowedRoles={["student", "mentor", "admin"]}><Settings /></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard allowedRoles={["student"]}><BrowseCourses /></AuthGuard>} />
            <Route path="/lessons" element={<AuthGuard allowedRoles={["student"]}><Lessons /></AuthGuard>} />
            <Route path="/leaderboard" element={<AuthGuard allowedRoles={["student", "mentor", "admin"]}><Leaderboard /></AuthGuard>} />
            <Route path="/achievements" element={<AuthGuard allowedRoles={["student"]}><Achievements /></AuthGuard>} />
            <Route path="/announcements" element={<AuthGuard allowedRoles={["student", "mentor"]}><Announcements /></AuthGuard>} />
            <Route path="/study-buddies" element={<AuthGuard allowedRoles={["student"]}><StudyBuddies /></AuthGuard>} />
            <Route path="/social-chat" element={<AuthGuard allowedRoles={["student", "mentor"]}><SocialChat /></AuthGuard>} />
            <Route path="/sessions" element={<AuthGuard allowedRoles={["student"]}><Sessions /></AuthGuard>} />
            <Route path="/sessions/:id" element={<AuthGuard allowedRoles={["student", "mentor"]}><SessionDetail /></AuthGuard>} />
            <Route path="/room/:id" element={<AuthGuard allowedRoles={["student", "mentor"]}><VideoRoom /></AuthGuard>} />
            <Route path="/projects" element={<AuthGuard allowedRoles={["student"]}><StudentProjects /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard allowedRoles={["student"]}><Dashboard /></AuthGuard>} />
            <Route path="/study-rooms" element={<AuthGuard allowedRoles={["student"]}><StudyRooms /></AuthGuard>} />
            <Route path="/study-rooms/:id" element={<AuthGuard allowedRoles={["student"]}><StudyRoomDetail /></AuthGuard>} />
            <Route path="/progress" element={<AuthGuard allowedRoles={["student"]}><ProgressPage /></AuthGuard>} />
            <Route path="/support" element={<AuthGuard allowedRoles={["student", "mentor"]}><SupportPage /></AuthGuard>} />

            {/* MENTOR DASHBOARD - Protected */}
            <Route path="/mentor/pending" element={<AuthGuard allowedRoles={["mentor"]}><MentorPendingApproval /></AuthGuard>} />
            <Route path="/mentor/dashboard" element={<AuthGuard allowedRoles={["mentor"]}><MentorDashboard /></AuthGuard>} />
            <Route path="/mentor/task/:id" element={<AuthGuard allowedRoles={["mentor"]}><MentorTaskBuilder /></AuthGuard>} />
            <Route path="/mentor/review" element={<AuthGuard allowedRoles={["mentor"]}><MentorReviewQueue /></AuthGuard>} />
            <Route path="/mentor/sessions" element={<AuthGuard allowedRoles={["mentor"]}><MentorSessions /></AuthGuard>} />
            <Route path="/mentor/chat" element={<AuthGuard allowedRoles={["mentor"]}><MentorChat /></AuthGuard>} />
            <Route path="/mentor/announcements" element={<AuthGuard allowedRoles={["mentor"]}><MentorAnnouncements /></AuthGuard>} />
            <Route path="/mentor/projects" element={<AuthGuard allowedRoles={["mentor"]}><MentorProjects /></AuthGuard>} />
            <Route path="/mentor/settings" element={<AuthGuard allowedRoles={["mentor"]}><MentorSettings /></AuthGuard>} />
            <Route path="/mentor/classes" element={<AuthGuard allowedRoles={["mentor"]}><MentorClasses /></AuthGuard>} />
            <Route path="/mentor/class/:id" element={<AuthGuard allowedRoles={["mentor"]}><MentorClassDetails /></AuthGuard>} />
            <Route path="/mentor/upload/:id" element={<AuthGuard allowedRoles={["mentor"]}><ClassUpload /></AuthGuard>} />
            <Route path="/mentor/analysis/:id" element={<AuthGuard allowedRoles={["mentor"]}><MentorCourseAnalysis /></AuthGuard>} />
            <Route path="/mentor/performance" element={<AuthGuard allowedRoles={["mentor"]}><StudentPerformance /></AuthGuard>} />

            {/* ADMIN DASHBOARD - Protected */}
            <Route path="/admin" element={<AuthGuard allowedRoles={["admin"]}><AdminLayout /></AuthGuard>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="activities" element={<Activities />} />
              <Route path="mentors" element={<AllMentors />} />
              <Route path="applications" element={<MentorApplications />} />
              <Route path="performance" element={<MentorPerformance />} />
              <Route path="mentor-reviews" element={<MentorReviews />} />
              <Route path="allstudents" element={<AllStudents />} />
              <Route path="enrollments" element={<StudentEnrollments />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="grades" element={<GradesStatus />} />
              <Route path="reports" element={<StudentReports />} />
              <Route path="all-courses" element={<AdminCourses />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="lessons" element={<AdminLessons />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="assignments" element={<AdminAssignments />} />
              <Route path="user-chat" element={<AdminChatPage />} />
              <Route path="tickets" element={<SupportTickets />} />
              <Route path="feedback" element={<AllFeedback />} />
              <Route path="settings/profile" element={<ProfileSettings />} />
              <Route path="settings/system" element={<SystemSettings />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
            </Route>

          </Routes>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;