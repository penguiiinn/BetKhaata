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

export default function App() {
  const activeTab = useBetStore((s) => s.activeTab);

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
        {renderScreen()}
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

