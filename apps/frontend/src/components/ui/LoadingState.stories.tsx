import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from './LoadingState';

const meta = {
  title: 'UI/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'default',
    message: 'Loading content…',
  },
};

export const CourseList: Story = {
  args: {
    type: 'course-list',
  },
};

export const CourseDetail: Story = {
  args: {
    type: 'course-detail',
  },
};

export const Dashboard: Story = {
  args: {
    type: 'dashboard',
  },
};
