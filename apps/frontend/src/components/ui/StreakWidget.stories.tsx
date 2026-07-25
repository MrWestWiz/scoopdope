import type { Meta, StoryObj } from '@storybook/react';
import { StreakWidget } from './StreakWidget';

const meta = {
  title: 'UI/StreakWidget',
  component: StreakWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StreakWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    currentStreak: 7,
    longestStreak: 14,
  },
};

export const NoStreak: Story = {
  args: {
    currentStreak: 0,
    longestStreak: 5,
  },
};

export const LongStreak: Story = {
  args: {
    currentStreak: 30,
    longestStreak: 30,
  },
};

export const Loading: Story = {
  args: {
    currentStreak: 0,
    longestStreak: 0,
    isLoading: true,
  },
};
