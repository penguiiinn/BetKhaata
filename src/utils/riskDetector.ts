import type { Bet, Bankroll } from '../types/types';
import dayjs from 'dayjs';

export interface RiskAnalysis {
  riskScore: 'Low' | 'Medium' | 'High' | 'Dangerous';
  disciplineScore: number;
  alerts: string[];
  nudges: string[];
  consecutiveLossesCount: number;
  hasMartingale: boolean;
  hasFrenzy: boolean;
  hasHighExposure: boolean;
  hasEmotionalTilt: boolean;
  recoverySuggestions: string[];
}

export function analyzeLossChasing(bets: Bet[], bankrolls: Bankroll[]): RiskAnalysis {
  const alerts: string[] = [];
  const nudges: string[] = [];
  const recoverySuggestions: string[] = [];

  // Sort bets chronologically (oldest to newest)
  const sortedBets = [...bets].sort((a, b) => dayjs(a.timePlaced).valueOf() - dayjs(b.timePlaced).valueOf());
  const settledBets = sortedBets.filter(b => b.status === 'won' || b.status === 'lost');

  // 1. 3+ losses in a row
  let consecutiveLossesCount = 0;
  let currentLosses = 0;
  
  // Go backwards from the end of settled bets
  for (let i = settledBets.length - 1; i >= 0; i--) {
    if (settledBets[i].status === 'lost') {
      currentLosses++;
    } else if (settledBets[i].status === 'won') {
      break; // broken streak
    }
  }
  consecutiveLossesCount = currentLosses;

  if (consecutiveLossesCount >= 3) {
    alerts.push(`Loss Chasing Detected (${consecutiveLossesCount} consecutive losses)`);
    nudges.push(`You have lost ${consecutiveLossesCount} bets in a row. Take a step back and avoid forced bets.`);
    recoverySuggestions.push('Take a 24-hour cooling-off break to reset your mindset.');
  }

  // 2. Martingale stake increase after a loss (increasing stake >= 1.8x)
  let hasMartingale = false;
  let martingaleDetails = '';

  for (let i = 0; i < settledBets.length - 1; i++) {
    const current = settledBets[i];
    const next = settledBets[i + 1];

    if (current.status === 'lost' && next.stake >= current.stake * 1.8) {
      // check if they were placed within 24 hours of each other
      const hoursDiff = dayjs(next.timePlaced).diff(dayjs(current.timePlaced), 'hour');
      if (hoursDiff <= 24) {
        hasMartingale = true;
        const multiplier = (next.stake / current.stake).toFixed(1);
        martingaleDetails = `Stake size jumped ${multiplier}x (₹${current.stake.toLocaleString('en-IN')} ➔ ₹${next.stake.toLocaleString('en-IN')}) after a loss on "${current.selection}"`;
        break;
      }
    }
  }

  if (hasMartingale) {
    alerts.push('Martingale Betting Pattern');
    nudges.push(martingaleDetails);
    recoverySuggestions.push('Disable flexible sizing: Switch to a flat staking strategy (e.g. exactly 2% of bankroll per bet).');
  }

  // 3. Multiple bets within a short time (frenzy betting - 3+ bets in 1 hour)
  let hasFrenzy = false;
  for (let i = 0; i < sortedBets.length; i++) {
    const currentBetTime = dayjs(sortedBets[i].timePlaced);
    let countInHour = 1;

    for (let j = i + 1; j < sortedBets.length; j++) {
      const nextBetTime = dayjs(sortedBets[j].timePlaced);
      const minutesDiff = nextBetTime.diff(currentBetTime, 'minute');
      if (minutesDiff <= 60) {
        countInHour++;
      } else {
        break;
      }
    }

    if (countInHour >= 3) {
      hasFrenzy = true;
      break;
    }
  }

  if (hasFrenzy) {
    alerts.push('Frenzy Betting Window');
    nudges.push("You're placing multiple bets in a very short duration. Avoid panic-pacing your logs.");
    recoverySuggestions.push('Set a bet pacing rule: limit yourself to a maximum of 2 bets per day.');
  }

  // 4. High % bankroll exposure (active exposure > 30% of total balance)
  const totalBalance = bankrolls.reduce((sum, b) => sum + b.balance, 0);
  const totalExposure = bankrolls.reduce((sum, b) => sum + b.activeExposure, 0);
  const exposurePct = totalBalance > 0 ? (totalExposure / totalBalance) * 100 : 0;
  const hasHighExposure = exposurePct > 30;

  if (hasHighExposure) {
    alerts.push(`High Capital Exposure (${exposurePct.toFixed(0)}%)`);
    nudges.push(`Active exposure is ${exposurePct.toFixed(0)}% of your total bankroll. You are risking too much capital at once.`);
    recoverySuggestions.push('Reduce risk: withdraw active exposures or lower stakes to stay below a 10% exposure limit.');
  }

  // 5. Emotional Tilt tracker (panic stake jump - bet placed within 30 mins after a loss with higher stake)
  let hasEmotionalTilt = false;
  let tiltDetails = '';

  for (let i = 0; i < sortedBets.length - 1; i++) {
    const current = sortedBets[i];
    
    // find a settled loss
    if (current.status === 'lost') {
      // check if any subsequent bet was placed within 30 minutes with a higher stake
      for (let j = i + 1; j < sortedBets.length; j++) {
        const next = sortedBets[j];
        const minutesDiff = dayjs(next.timePlaced).diff(dayjs(current.timePlaced), 'minute');
        
        if (minutesDiff >= 0 && minutesDiff <= 30 && next.stake > current.stake) {
          hasEmotionalTilt = true;
          tiltDetails = `Panic bet placed on "${next.selection}" (₹${next.stake.toLocaleString('en-IN')}) just ${minutesDiff} mins after a loss (₹${current.stake.toLocaleString('en-IN')}).`;
          break;
        }
      }
    }
    if (hasEmotionalTilt) break;
  }

  if (hasEmotionalTilt) {
    alerts.push('Emotional Tilt (Panic Staking)');
    nudges.push(tiltDetails);
    recoverySuggestions.push('Implement a self-imposed lock: Log off the platform for 1 hour immediately after any loss is settled.');
  }

  // 6. Calculate Discipline Score
  let disciplineScore = 100;
  if (hasMartingale) disciplineScore -= 25;
  if (hasEmotionalTilt) disciplineScore -= 25;
  if (consecutiveLossesCount >= 3) disciplineScore -= 20;
  if (hasFrenzy) disciplineScore -= 15;
  if (hasHighExposure) disciplineScore -= 15;

  disciplineScore = Math.max(10, disciplineScore);

  // 7. Calculate Risk Score
  let riskScore: 'Low' | 'Medium' | 'High' | 'Dangerous' = 'Low';
  if (disciplineScore <= 40) {
    riskScore = 'Dangerous';
  } else if (disciplineScore <= 65) {
    riskScore = 'High';
  } else if (disciplineScore <= 85) {
    riskScore = 'Medium';
  }

  // Default suggestions if none triggered
  if (recoverySuggestions.length === 0) {
    recoverySuggestions.push('Maintain healthy betting habits. Keep stakes below 3% of your single bankroll balance.');
    recoverySuggestions.push('Document your rationale: write a quick note for every bet to ensure discipline.');
  }

  return {
    riskScore,
    disciplineScore,
    alerts,
    nudges,
    consecutiveLossesCount,
    hasMartingale,
    hasFrenzy,
    hasHighExposure,
    hasEmotionalTilt,
    recoverySuggestions,
  };
}

export interface HourHeatmap {
  hour: number;
  betCount: number;
  totalStake: number;
  intensity: number; // 0 to 1
}

export function calculateHeatmap(bets: Bet[]): HourHeatmap[] {
  const heatmap: HourHeatmap[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    betCount: 0,
    totalStake: 0,
    intensity: 0,
  }));

  if (bets.length === 0) return heatmap;

  bets.forEach(b => {
    const hr = dayjs(b.timePlaced).hour();
    if (hr >= 0 && hr < 24) {
      heatmap[hr].betCount++;
      heatmap[hr].totalStake += b.stake;
    }
  });

  const maxStake = Math.max(...heatmap.map(h => h.totalStake), 1);
  heatmap.forEach(h => {
    h.intensity = h.totalStake / maxStake;
  });

  return heatmap;
}

export interface WeeklyReport {
  weeklyAlertsCount: number;
  averageDiscipline: number;
  weeklyTrend: 'Improving' | 'Stable' | 'Declining';
  rating: 'Safe' | 'Guarded' | 'Risky' | 'Critical';
}

export function compileWeeklyReport(bets: Bet[], bankrolls: Bankroll[]): WeeklyReport {
  const last7DaysBets = bets.filter(b => dayjs(b.timePlaced).isAfter(dayjs().subtract(7, 'day')));
  const prev7DaysBets = bets.filter(b => 
    dayjs(b.timePlaced).isAfter(dayjs().subtract(14, 'day')) && 
    dayjs(b.timePlaced).isBefore(dayjs().subtract(7, 'day'))
  );

  const currentAnalysis = analyzeLossChasing(last7DaysBets, bankrolls);
  const prevAnalysis = analyzeLossChasing(prev7DaysBets, bankrolls);

  const weeklyAlertsCount = currentAnalysis.alerts.length;
  const averageDiscipline = currentAnalysis.disciplineScore;

  let weeklyTrend: 'Improving' | 'Stable' | 'Declining' = 'Stable';
  if (currentAnalysis.disciplineScore > prevAnalysis.disciplineScore + 5) {
    weeklyTrend = 'Improving';
  } else if (currentAnalysis.disciplineScore < prevAnalysis.disciplineScore - 5) {
    weeklyTrend = 'Declining';
  }

  let rating: 'Safe' | 'Guarded' | 'Risky' | 'Critical' = 'Safe';
  if (averageDiscipline <= 40) {
    rating = 'Critical';
  } else if (averageDiscipline <= 65) {
    rating = 'Risky';
  } else if (averageDiscipline <= 85) {
    rating = 'Guarded';
  }

  return {
    weeklyAlertsCount,
    averageDiscipline,
    weeklyTrend,
    rating,
  };
}
