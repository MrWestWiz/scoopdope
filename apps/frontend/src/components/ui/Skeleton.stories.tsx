import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Skeleton, CourseCardSkeleton, CourseListSkeleton, DashboardSkeleton } from './Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: 200,
    height: 16,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
  },
};

export const PulseAnimation: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
    animation: 'pulse',
  },
};

export const NoAnimation: Story = {
  args: {
    variant: 'rectangular',
    width: 300,
    height: 200,
    animation: 'none',
  },
};

export const CourseCardLoading: StoryObj<typeof meta> = {
  render: () => <CourseCardSkeleton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skeleton = canvas.getByRole('status');
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');
  },
};

export const CourseListLoading: StoryObj<typeof meta> = {
  render: () => <CourseListSkeleton count={3} />,
};

export const DashboardLoading: StoryObj<typeof meta> = {
  render: () => <DashboardSkeleton />,
};
