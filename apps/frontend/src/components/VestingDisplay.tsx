'use client';

export interface VestingSchedule {
  total: number;
  startLedger: number;
  cliffLedger: number;
  endLedger: number;
}

interface Props {
  vesting?: VestingSchedule | null;
  isLocked?: boolean;
}

export function VestingDisplay({ vesting, isLocked }: Props) {
  if (!vesting) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-1">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Vesting Schedule</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Total: {vesting.total}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">Cliff ledger: {vesting.cliffLedger}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">End ledger: {vesting.endLedger}</p>
      {isLocked && (
        <span className="inline-block text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
          Locked
        </span>
      )}
    </div>
  );
}
