import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Breadcrumb, CompactBreadcrumb } from './Breadcrumb';

const meta = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Blockchain Basics', href: '/courses/blockchain-basics', current: true },
];

export const Default: Story = {
  args: {
    items: sampleItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav).toBeInTheDocument();
    const currentPage = canvas.getByText('Blockchain Basics');
    await expect(currentPage).toHaveAttribute('aria-current', 'page');
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard', current: true },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home', href: '/', current: true }],
  },
};

export const Compact: StoryObj<typeof meta> = {
  render: () => (
    <CompactBreadcrumb
      items={[
        { label: 'Courses', href: '/courses' },
        { label: 'Advanced Topics', href: '/courses/advanced', current: true },
      ]}
    />
  ),
};
