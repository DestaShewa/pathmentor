import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * useInactivityLogout monitors user activity (mouse, keyboard, etc.)
 * and automatically logs out the user after 20 minutes of inactivity.
 */
const useInactivityLogout = (timeoutMinutes: number = 20) => {
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.error("Logged out due to 20 minutes of inactivity", {
      description: "Please log in again to continue.",
      duration: 6000
    });
    navigate("/auth");
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Only set timer if token exists (user is logged in)
    if (localStorage.getItem("token")) {
      timerRef.current = setTimeout(handleLogout, timeoutMs);
    }
  };

  useEffect(() => {
    // Events to monitor for activity
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    const throttledReset = () => {
      // Basic throttle to avoid excessive timer resets
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledReset);
    });

    // Initialize timer on mount
    resetTimer();

    // Cleanup listeners and timer
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [navigate]);

  return { resetTimer };
};

export default useInactivityLogout;
