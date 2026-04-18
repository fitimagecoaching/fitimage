import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppSidebar } from "./components/app-sidebar";

// Pages
import LoginPage from "./pages/login";
import CoachDashboard from "./pages/coach/dashboard";
import ProgramsPage from "./pages/coach/programs";
import ProgramBuilder from "./pages/coach/program-builder";
import ClientsPage from "./pages/coach/clients";
import MyProgramPage from "./pages/client/my-program";
import ProgressPage from "./pages/client/progress";
import HabitsPage from "./pages/client/habits";
import MessagesPage from "./pages/shared/messages";
import MinistryPage from "./pages/shared/ministry";
import CommunityPage from "./pages/shared/community";
import NotFound from "./pages/not-found";

function AppLayout() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header */}
          <header className="flex items-center gap-3 px-4 h-14 border-b md:hidden flex-shrink-0">
            <SidebarTrigger data-testid="sidebar-trigger" />
            <span className="font-bold text-sm tracking-wide">FITIMAGE COACHING</span>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Router hook={useHashLocation}>
              <Switch>
                {user.role === "coach" ? (
                  <>
                    <Route path="/" component={CoachDashboard} />
                    <Route path="/programs" component={ProgramsPage} />
                    <Route path="/programs/:id" component={ProgramBuilder} />
                    <Route path="/clients" component={ClientsPage} />
                    <Route path="/ministry" component={MinistryPage} />
                    <Route path="/community" component={CommunityPage} />
                    <Route path="/messages" component={MessagesPage} />
                  </>
                ) : (
                  <>
                    <Route path="/" component={MyProgramPage} />
                    <Route path="/progress" component={ProgressPage} />
                    <Route path="/habits" component={HabitsPage} />
                    <Route path="/ministry" component={MinistryPage} />
                    <Route path="/community" component={CommunityPage} />
                    <Route path="/messages" component={MessagesPage} />
                  </>
                )}
                <Route component={NotFound} />
              </Switch>
            </Router>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
