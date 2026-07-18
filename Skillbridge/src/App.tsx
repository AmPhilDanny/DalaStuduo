import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Jobs from "@/pages/Jobs";
import Talent from "@/pages/Talent";
import Profile from "@/pages/Profile";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import ProjectCollaboration from "@/pages/ProjectCollaboration";
import MyApplications from "@/pages/MyApplications";
import Tutor from "@/pages/Tutor";
import TutorChat from "@/pages/TutorChat";
import UserDashboard from "@/pages/UserDashboard";
import PostJob from "@/pages/PostJob";
import Marketplace from "@/pages/Marketplace";
import MarketplaceDetail from "@/pages/MarketplaceDetail";
import CreateListing from "@/pages/CreateListing";
import MyOrders from "@/pages/MyOrders";
import Wallet from "@/pages/Wallet";
import MyListings from "@/pages/MyListings";
import OrderDetail from "@/pages/OrderDetail";
import Messages from "@/pages/Messages";
import VideoRoom from "@/pages/VideoRoom";

import Disputes from "@/pages/Disputes";
import DisputeDetail from "@/pages/DisputeDetail";
import OrgVerification from "@/pages/OrgVerification";
import Connections from "@/pages/Connections";
import OrgSetup from "@/b2b/pages/OrgSetup";
import InviteAccept from "@/b2b/pages/InviteAccept";
import OrgSubnav from "@/b2b/components/layout/OrgSubnav";
import TeamList from "@/b2b/components/team/TeamList";
import TalentSearch from "@/b2b/components/talent/TalentSearch";
import TalentListManager from "@/b2b/components/talent/TalentListManager";
import BulkJobPost from "@/b2b/components/hiring/BulkJobPost";
import PipelineView from "@/b2b/components/hiring/PipelineView";
import ContractList from "@/b2b/components/contracts/ContractList";
import ComplianceDashboard from "@/b2b/components/compliance/ComplianceDashboard";
import AnalyticsDashboard from "@/b2b/components/analytics/AnalyticsDashboard";
import SettingsPage from "@/b2b/components/settings/SettingsPage";
import { OrgProvider } from "@/b2b/hooks/useOrg";

function AdminRedirect() {
  window.location.href = 'http://localhost:4000/';
  return null;
}

function MetaUpdater() {
  const { config } = useSiteSettings();
  useEffect(() => {
    const m = config.meta;
    if (!m?.title) return;
    document.title = m.title;
    setMeta('description', m.description);
    setMeta('keywords', m.keywords);
    setMeta('author', m.author);
    setMeta('theme-color', m.theme_color);
    setMeta('og:title', m.title);
    setMeta('og:description', m.description);
    setMeta('og:image', m.og_image_url);
    setMeta('twitter:title', m.title);
    setMeta('twitter:description', m.description);
    setMeta('twitter:image', m.og_image_url);
  }, [config]);
  return null;
}

function setMeta(name: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <MetaUpdater />
        <div className="min-h-screen bg-background text-foreground selection:bg-secondary/30 selection:text-primary">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/talent" element={<Talent />} />
              <Route path="/talent/:id" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/collaboration" element={<ProjectCollaboration />} />
              <Route path="/my-applications" element={<MyApplications />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/tutor/:id" element={<TutorChat />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/dashboard/org" element={<Navigate to="/dashboard" replace />} />
              <Route path="/jobs/new" element={<PostJob />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/new" element={<CreateListing />} />
              <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/org/verification" element={<OrgProvider><OrgVerification /></OrgProvider>} />
              <Route path="/video-call/:roomId" element={<VideoRoom />} />
              <Route path="/disputes" element={<Disputes />} />
              <Route path="/disputes/:id" element={<DisputeDetail />} />
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/b2b/setup" element={<OrgSetup />} />
              <Route path="/b2b/invite/accept" element={<InviteAccept />} />
              <Route path="/b2b/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/b2b" element={
                <OrgProvider>
                  <OrgSubnav />
                  <div className="pt-8 pb-12 px-4 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                      <Outlet />
                    </div>
                  </div>
                </OrgProvider>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="team" element={<TeamList />} />
                <Route path="talent" element={<TalentSearch />} />
                <Route path="talent/lists" element={<TalentListManager />} />
                <Route path="hiring" element={<BulkJobPost />} />
                <Route path="hiring/pipeline" element={<PipelineView />} />
                <Route path="contracts" element={<ContractList />} />
                <Route path="compliance" element={<ComplianceDashboard />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
