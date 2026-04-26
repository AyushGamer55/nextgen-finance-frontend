import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";

const field =
  "w-full bg-muted rounded-lg px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary border border-transparent";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      toast.success("Signed in successfully");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-muted to-background/90 flex flex-col items-center justify-center p-6">
      {/* Animated Background Blobs - Theme matching */}
      <div className="absolute w-80 h-80 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/10 rounded-full blur-3xl top-1/4 left-2/3 -translate-x-1/2 animate-blob z-0" />
      <div className="absolute w-64 h-64 bg-gradient-to-r from-secondary/20 via-primary/10 to-muted/20 rounded-full blur-3xl bottom-1/4 left-1/4 animate-blob animation-delay-2000 z-0" />
      
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 z-10 relative">
        ← Back to home
      </Link>
      
      <div className="w-full max-w-md bg-card/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 space-y-6 relative z-10 border border-border/50">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please sign in to your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-muted-foreground">Password</label>
              <span className="text-xs text-muted-foreground">Minimum 6 chars</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                className={`${field} pl-12 pr-12`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:scale-[1.02] hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? "Signing in..." : "Sign in →"}
          </button>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium hover:text-primary/90 transition-colors">
            Create one
          </Link>
        </p>
      </div>

    </div>
  );
}

