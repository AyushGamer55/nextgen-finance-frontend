import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }) {
  const { isAuthed, session } = useAuth();

  if (session === null) {
    // Explicitly not authed
    return <Navigate to="/login" replace />;
  }

  if (session === undefined) {
    // Loading state (initial context load)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Authed
  return children;
}

