
import { InterestBreakdown } from '../types';

export const calculateInterest = (principal: number, startDateStr: string, dueDateStr: string): InterestBreakdown => {
  const start = new Date(startDateStr);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
  
  // New logic: 
  // 1-7 days = 10% base
  // > 7 days = 30% base
  const baseInterestRate = daysElapsed <= 7 ? 0.10 : 0.30;
  const baseInterest = principal * baseInterestRate;
  
  // 1% per day service fee
  const dailyInterest = principal * 0.01 * daysElapsed;
  
  let lateDelayFee = 0;
  // Penalty fee 10% per day only after 30 days
  if (daysElapsed > 30) {
    const penaltyDays = daysElapsed - 30;
    lateDelayFee = principal * 0.10 * penaltyDays;
  }

  const totalDue = principal + baseInterest + dailyInterest + lateDelayFee;

  return {
    principal,
    baseInterest,
    dailyInterest,
    lateDelayFee,
    monthlyPenalty: 0, // Deprecated in favor of daily penalty
    totalDue,
    daysElapsed
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
  }).format(amount);
};
