import type { Meta, StoryObj } from '@storybook/react';
import { CircularProgress } from './CircularProgress';

const meta = {
  title: 'UI/CircularProgress',
  component: CircularProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CircularProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: 0,
    label: 'No Progress',
  },
};

export const Quarter: Story = {
  args: {
    value: 25,
    label: 'Getting Started',
  },
};

export const Halfway: Story = {
  args: {
    value: 50,
    label: 'Halfway There',
  },
};

export const AlmostDone: Story = {
  args: {
    value: 85,
    label: 'Almost Complete',
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    label: 'Completed',
  },
};

export const CustomSize: Story = {
  args: {
    value: 65,
    size: 120,
    strokeWidth: 12,
    label: 'Custom Size',
  },
};

export const NoLabel: Story = {
  args: {
    value: 42,
  },
};
