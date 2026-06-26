import { useEffect, useState } from 'react';
import { useBetStore } from '../store/betStore';
import Header from './layout/Header';
import BottomNav from './layout/BottomNav';
import HomeScreen from './home/HomeScreen';
import MatchesScreen from './matches/MatchesScreen';
import BetsScreen from './bets/BetsScreen';
import InsightsScreen from './insights/InsightsScreen';
import BankrollScreen from './bankroll/BankrollScreen';
import AddBetModal from './shared/AddBetModal';
import DepositModal from './shared/DepositModal';
import WithdrawModal from './shared/WithdrawModal';
import SetLimitModal from './shared/SetLimitModal';
import EditBetModal from './shared/EditBetModal';
import ErrorBoundary from './shared/ErrorBoundary';
import { SkeletonCard, SkeletonChart, SkeletonBase } from './shared/SkeletonLoader';

function MainApp() {
  const activeTab = useBetStore((s) => s.activeTab);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!useBetStore.persist) {
      setHydrated(true);
      return;
    }
    // Listen for hydration status changes
    const unsubHydrate = useBetStore.persist.onHydrate(() => setHydrated(false));
    const unsubFinishHydrate = useBetStore.persist.onFinishHydration(() => setHydrated(true));

    // Initialize with current status
    setHydrated(useBetStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydrate();
    };
  }, []);

  const renderSkeletonScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="px-4 py-4 space-y-4 max-w-[430px] md:max-w-3xl lg:max-w-6xl mx-auto">
            <SkeletonBase className="h-28 w-full rounded-2xl animate-pulse-soft" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBase className="h-16 w-full rounded-xl animate-pulse-soft" />
              <SkeletonBase className="h-16 w-full rounded-xl animate-pulse-soft" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <SkeletonBase className="h-20 w-full rounded-xl animate-pulse-soft" />
              <SkeletonBase className="h-20 w-full rounded-xl animate-pulse-soft" />
              <SkeletonBase className="h-20 w-full rounded-xl animate-pulse-soft" />
            </div>
            <SkeletonBase className="h-4 w-32 mt-4 animate-pulse-soft" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        );
      case 'matches':
        return (
          <div className="px-4 py-4 space-y-4 max-w-[430px] md:max-w-3xl lg:max-w-6xl mx-auto">
            <div className="flex gap-2">
              <SkeletonBase className="h-8 w-20 rounded-full animate-pulse-soft" />
              <SkeletonBase className="h-8 w-20 rounded-full animate-pulse-soft" />
              <SkeletonBase className="h-8 w-20 rounded-full animate-pulse-soft" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        );
      case 'bets':
        return (
          <div className="px-4 py-4 space-y-4 max-w-[430px] md:max-w-3xl lg:max-w-6xl mx-auto">
            <div className="relative">
              <SkeletonBase className="h-10 w-full rounded-xl animate-pulse-soft" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        );
      case 'insights':
        return (
          <div className="px-4 py-4 space-y-4 max-w-[430px] md:max-w-3xl lg:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <SkeletonBase className="h-24 w-full rounded-xl animate-pulse-soft" />
            </div>
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        );
      case 'bankroll':
        return (
          <div className="px-4 py-4 space-y-4 max-w-[430px] md:max-w-3xl lg:max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <SkeletonBase className="h-36 w-full rounded-2xl animate-pulse-soft" />
              <div className="grid grid-cols-3 gap-2.5">
                <SkeletonBase className="h-16 w-full rounded-xl animate-pulse-soft" />
                <SkeletonBase className="h-16 w-full rounded-xl animate-pulse-soft" />
                <SkeletonBase className="h-16 w-full rounded-xl animate-pulse-soft" />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonBase className="h-56 w-full rounded-xl animate-pulse-soft" />
            </div>
          </div>
        );
      default:
        return <div className="p-4 text-center">Loading...</div>;
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'matches':
        return <MatchesScreen />;
      case 'bets':
        return <BetsScreen />;
      case 'insights':
        return <InsightsScreen />;
      case 'bankroll':
        return <BankrollScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white font-sans">
      <Header />

      <main className="pt-14 pb-20">
        {hydrated ? renderScreen() : renderSkeletonScreen()}
      </main>

      <BottomNav />

      {/* Global Modals */}
      <AddBetModal />
      <DepositModal />
      <WithdrawModal />
      <SetLimitModal />
      <EditBetModal />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
