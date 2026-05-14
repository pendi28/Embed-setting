import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MovieDetail from "@/pages/movie-detail";
import TvDetail from "@/pages/tv-detail";
import EmbedMovie from "@/pages/embed-movie";
import EmbedTv from "@/pages/embed-tv";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/tv/:id" component={TvDetail} />
      <Route path="/embed/movie/:id" component={EmbedMovie} />
      <Route path="/embed/tv/:id/:season/:episode" component={EmbedTv} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force dark mode
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
