import type { Meta, StoryObj } from '@storybook/react';
import { CourseProgress } from './CourseProgress';

const meta = {
  title: 'UI/CourseProgress',
  component: CourseProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CourseProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleModules = [
  {
    id: 'mod-1',
    title: 'Getting Started',
    lessons: [
      { id: 'l1', title: 'Introduction', completed: true },
      { id: 'l2', title: 'Setting Up Your Environment', completed: true },
      { id: 'l3', title: 'First Smart Contract', completed: false },
    ],
  },
  {
    id: 'mod-2',
    title: 'Core Concepts',
    lessons: [
      { id: 'l4', title: 'Data Types', completed: true },
      { id: 'l5', title: 'Functions', completed: false },
      { id: 'l6', title: 'Events', completed: false },
      { id: 'l7', title: 'Error Handling', completed: false },
    ],
  },
  {
    id: 'mod-3',
    title: 'Advanced Topics',
    lessons: [
      { id: 'l8', title: 'Upgradeable Contracts', completed: false },
      { id: 'l9', title: 'Gas Optimization', completed: false },
    ],
  },
];

export const InProgress: Story = {
  args: {
    courseId: 'course-1',
    modules: sampleModules,
    timeSpentMinutes: 180,
    estimatedMinutes: 600,
  },
};

export const JustStarted: Story = {
  args: {
    courseId: 'course-2',
    modules: [
      {
        id: 'mod-1',
        title: 'Introduction',
        lessons: [
          { id: 'l1', title: 'Welcome', completed: false },
          { id: 'l2', title: 'Course Overview', completed: false },
        ],
      },
    ],
  },
};

export const Complete: Story = {
  args: {
    courseId: 'course-3',
    modules: [
      {
        id: 'mod-1',
        title: 'Complete Module',
        lessons: [
          { id: 'l1', title: 'Lesson 1', completed: true },
          { id: 'l2', title: 'Lesson 2', completed: true },
        ],
      },
    ],
    timeSpentMinutes: 120,
    estimatedMinutes: 120,
  },
};
