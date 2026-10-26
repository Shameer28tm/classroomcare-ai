import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';

// 10 Operational Pages
import { Overview } from './pages/Overview';
import { Tickets } from './pages/Tickets';
import { AgentActivity } from './pages/AgentActivity';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { TechnicianWorkspace } from './pages/TechnicianWorkspace';
import { Facilities } from './pages/Facilities';
import { SlaMonitoring } from './pages/SlaMonitoring';
import { Analytics } from './pages/Analytics';
import { Notifications } from './pages/Notifications';
import { Admin } from './pages/Admin';
import { UserGuide } from './pages/UserGuide';
import { NotFound } from './pages/NotFound';
import { OnboardingTour } from './components/onboarding/OnboardingTour';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OnboardingTour />
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="agent" element={<AgentActivity />} />
            <Route path="knowledge" element={<KnowledgeBase />} />
            <Route path="technician" element={<TechnicianWorkspace />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="buildings" element={<Facilities />} />
            <Route path="sla" element={<SlaMonitoring />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="admin" element={<Admin />} />
            <Route path="guide" element={<UserGuide />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
