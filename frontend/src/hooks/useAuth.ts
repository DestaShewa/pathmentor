/**
 * useAuth — centralized authentication hook
 * Provides user data, loading state, and auth utilities
 * across all pages without repeating fetch logic.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
  onboardingCompleted: boolean;
  assignedMentor?: string;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
    commitmentTime?: string;
    learningStyle?: string;
    learningGoal?: string;
    persona?: string;
    course?: { id: string; title: string };
  };
  mentorVerification?: { status: "pending" | "approved" | "rejected" };
  streak?: { current: number; longest: number; lastStudiedAt?: string };
  status?: string;
}

interface UseAuthOptions {
  /** If true, redirect to /auth when not authenticated. Default: true */
  requireAuth?: boolean;
  /** If set, redirect to this path when role doesn't match */
  requiredRole?: "student" | "mentor" | "admin";
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const { requireAuth = true, requiredRole } = options;
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (requireAuth) navigate("/auth");
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/users/profile");
      const userData: AuthUser = res.data.user;

      // Role guard
      if (requiredRole && userData.role !== requiredRole) {
        if (userData.role === "admin") navigate("/admin/dashboard");
        else if (userData.role === "mentor") navigate("/mentor/dashboard");
        else navigate("/dashboard");
        return;
      }

      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        if (requireAuth) navigate("/auth");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, requireAuth, requiredRole]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/auth");
  }, [navigate]);

  const refreshUser = useCallback(() => {
    setLoading(true);
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, signOut, refreshUser, setUser };
};

export default useAuth;
