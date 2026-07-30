import type { AchievementInput, BadgeState } from './types';

export default function computeAchievements(input: AchievementInput): BadgeState[] {
  const { credentialCount, bstBalance, progressRecords } = input;

  const firstStep = {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete your first course',
    earned: credentialCount >= 1,
  };

  const courseCollector = {
    id: 'course-collector',
    name: 'Course Collector',
    description: 'Earn 5 course credentials',
    earned: credentialCount >= 5,
  };

  const tokenEarner = {
    id: 'token-earner',
    name: 'Token Earner',
    description: 'Have a positive BST balance',
    earned: bstBalance > 0,
  };

  const highAchiever = {
    id: 'high-achiever',
    name: 'High Achiever',
    description: 'Accumulate at least 500 BST',
    earned: bstBalance >= 500,
  };

  const dedicatedLearner = {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Have at least one in-progress course',
    earned: progressRecords.some((r) => r.progressPct > 0 && r.progressPct < 100),
  };

  return [firstStep, courseCollector, tokenEarner, highAchiever, dedicatedLearner];
}
