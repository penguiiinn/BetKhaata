import BankrollHero from './BankrollHero';
import PnLCards from './PnLCards';
import StatsRow from './StatsRow';
import QuickActions from './QuickActions';
import RunningBets from './RunningBets';

export default function HomeScreen() {
  return (
    <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
      <div className="space-y-4 md:col-span-1 lg:col-span-2">
        <BankrollHero />
        <PnLCards />
        <StatsRow />
        <QuickActions />
      </div>
      <div className="space-y-4 md:col-span-1 lg:col-span-1">
        <RunningBets />
      </div>
    </div>
  );
}
