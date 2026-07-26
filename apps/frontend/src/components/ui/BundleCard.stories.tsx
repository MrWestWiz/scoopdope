import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import { BundleCard } from './BundleCard';

const meta = {
  title: 'UI/BundleCard',
  component: BundleCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BundleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleBundle = {
  id: 'bundle-1',
  title: 'Blockchain Developer Bundle',
  description: 'Master blockchain development from fundamentals to advanced smart contracts.',
  price: 299,
  discountPrice: 149,
  courses: [
    { id: 'c1', title: 'Blockchain Fundamentals' },
    { id: 'c2', title: 'Smart Contract Development' },
    { id: 'c3', title: 'Advanced Solidity' },
    { id: 'c4', title: 'dApp Architecture' },
  ],
};

export const Default: Story = {
  args: {
    bundle: sampleBundle,
    onViewDetails: () => {},
    onPurchase: () => {},
  },
};

export const AlreadyPurchased: Story = {
  args: {
    bundle: sampleBundle,
    onViewDetails: () => {},
    onPurchase: () => {},
    isPurchased: true,
  },
};

export const NoDiscount: Story = {
  args: {
    bundle: { ...sampleBundle, discountPrice: null },
    onViewDetails: () => {},
    onPurchase: () => {},
  },
};

export const Interactive: Story = {
  args: {
    bundle: sampleBundle,
    onViewDetails: () => {},
    onPurchase: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detailsBtn = canvas.getByText('Details');
    await userEvent.click(detailsBtn);
    await expect(detailsBtn).toBeEnabled();
  },
};
