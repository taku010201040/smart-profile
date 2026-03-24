import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Record from "./pages/Record";
import Activities from "./pages/Activities";
import Profile from "./pages/Profile";
import Tasks from "./pages/Tasks";
import Motivation from "./pages/Motivation";
import Matching from "./pages/Matching";
import DigitalCard from "./pages/DigitalCard";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/record" component={Record} />
        <Route path="/activities" component={Activities} />
        <Route path="/profile" component={Profile} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/motivation" component={Motivation} />
        <Route path="/matching" component={Matching} />
        <Route path="/card" component={DigitalCard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
