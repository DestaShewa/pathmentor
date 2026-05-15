import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * AuthGuard protects routes by checking for a valid JWT token.
 * It also handles role-based access control and redirects unauthorized users.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  // ⚡ Instant Check: Check for token presence immediately during render
  const initialToken = localStorage.getItem("token");
  const [isVerifying, setIsVerifying] = useState(!!initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }

      try {
        // Decode JWT payload (standard Base64 decode)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem("token");
          toast.error("Session expired. Please log in again.");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
          setUserRole(payload.role);
        }
      } catch (error) {
        console.error("AuthGuard: Token validation failed", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [location.pathname]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Verifying secure session...
        </p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    toast.error("Unauthorized access to this dashboard");
    
    // Redirect to respective dashboard if they have a session but wrong role
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "mentor") return <Navigate to="/mentor/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
