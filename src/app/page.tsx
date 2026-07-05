"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/sections/navbar";
import { BottomNav } from "@/components/sections/bottom-nav";
import { TopBanner } from "@/components/sections/top-banner";
import { WinnersBar } from "@/components/sections/winners-bar";
import { LiveCompetingBox } from "@/components/sections/live-competing-box";
import { BannerSlider } from "@/components/sections/banner-slider";
import { StatsSection } from "@/components/sections/stats-section";
import { TrustSection } from "@/components/sections/trust-section";
import { HowItWorks } from "@/components/sections/how-it-works";
import { TournamentsSection } from "@/components/sections/tournaments-section";
import { InstallAppCard } from "@/components/sections/install-app-card";
import { LeaderboardSection } from "@/components/sections/leaderboard-section";
import { FaqSection } from "@/components/sections/faq-section";
import { Footer } from "@/components/sections/footer";
import { LoginModal } from "@/components/modals/login-modal";
import { TournamentDetailsModal } from "@/components/modals/tournament-details-modal";
import { DashboardModal } from "@/components/modals/dashboard-modal";
import { AdminModal } from "@/components/modals/admin-modal";
import { InfoModals } from "@/components/modals/info-modals";
import { ProfileModal } from "@/components/modals/profile-modal";
import { RechargeModal } from "@/components/modals/recharge-modal";
import { WithdrawModal } from "@/components/modals/withdraw-modal";
import { ChatModal } from "@/components/modals/chat-modal";
import { useUI } from "@/stores/ui-store";
import { DEMO_STATS } from "@/lib/constants";

async function fetchStats() {
  const res = await fetch("/api/stats", { cache: "no-store" });
  const data = await res.json();
  return data.stats;
}

async function ensureSeeded() {
  try {
    await fetch("/api/seed", { method: "POST" });
  } catch {
    // ignore — seed failure shouldn't block rendering
  }
}

export default function Home() {
  const { scrollTo, setScrollTo } = useUI();

  // Seed demo data once on first mount (idempotent)
  useEffect(() => {
    ensureSeeded();
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    initialData: DEMO_STATS,
  });

  // Smooth scroll to section
  useEffect(() => {
    if (!scrollTo) return;
    const el = document.getElementById(scrollTo);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setScrollTo(null);
  }, [scrollTo, setScrollTo]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <TopBanner />
        <WinnersBar />
        <LiveCompetingBox />
        <TournamentsSection />
        <BannerSlider />
        <StatsSection stats={stats ?? DEMO_STATS} />
        <HowItWorks />
        <TrustSection />
        <LeaderboardSection />
        <FaqSection />
      </main>

      <Footer />
      <BottomNav />

      {/* Modals */}
      <LoginModal />
      <TournamentDetailsModal />
      <DashboardModal />
      <AdminModal />
      <InfoModals />
      <ProfileModal />
      <RechargeModal />
      <WithdrawModal />
      <ChatModal />
      <InstallAppCard />
    </div>
  );
}
