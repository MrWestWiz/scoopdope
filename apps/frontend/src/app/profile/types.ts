export interface ProgressRecord {
  courseId: string;
  progressPct: number;
}

export interface CredentialRecord {
  id: string;
  courseTitle?: string;
  issuedAt: string;
  txHash?: string | null;
}

export interface BadgeState {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface AchievementInput {
  credentialCount: number;
  bstBalance: number;
  progressRecords: ProgressRecord[];
}
