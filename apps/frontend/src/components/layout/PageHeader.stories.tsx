import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'My Courses',
    description: 'Browse and manage your enrolled courses.',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'Blockchain Fundamentals',
    description: 'Learn the core concepts of blockchain technology.',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
      { label: 'Blockchain Fundamentals', href: '/courses/blockchain-fundamentals', current: true },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: 'Course Settings',
    description: 'Configure your course preferences.',
    actions: (
      <>
        <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          Cancel
        </button>
        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </>
    ),
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Dashboard',
  },
};
