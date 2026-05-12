// Shared sidebar navigation handler for all student pages
export const handleSidebarNav = (view: string, navigate: (path: string) => void) => {
  const routes: Record<string, string> = {
    dashboard:     "/dashboard",
    lessons:       "/lessons",
    courses:       "/courses",
    leaderboard:   "/leaderboard",
    achievements:  "/achievements",
    announcements: "/announcements",
    community:     "/study-buddies",
    sessions:      "/sessions",
    profile:       "/profile",
    settings:      "/settings",
    projects:      "/projects",
    roadmap:       "/roadmap",
    "study-rooms": "/study-rooms",
    // progress is an in-page view on Dashboard
    progress:      "/dashboard",
    support:       "/support",
  };
  if (routes[view]) navigate(routes[view]);
};
