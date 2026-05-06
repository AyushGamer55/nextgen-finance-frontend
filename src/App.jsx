import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import { AuthProvider } from "./context/AuthContext";
import { MlInsightsProvider } from "./context/MlInsightsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdvisorChatWidget } from "./components/advisor/AdvisorChatWidget";

const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Settings = lazy(() => import("./pages/Settings"));
const Upload = lazy(() => import("./pages/Upload"));
const Report = lazy(() => import("./pages/Report"));
const Invest = lazy(() => import("./pages/Invest"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading page...
    </div>
  );
}

const App = () => {
  return (
    <div className="min-h-screen">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FinanceProvider>
            <MlInsightsProvider>
              <TooltipProvider>
                <Toaster />
                <SonnerToaster />
                <BrowserRouter>
                  <AdvisorChatWidget />
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
                      <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
                      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                      <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </MlInsightsProvider>
          </FinanceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
