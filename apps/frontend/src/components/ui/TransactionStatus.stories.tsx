import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { TransactionStatus } from './TransactionStatus';

const meta = {
  title: 'UI/TransactionStatus',
  component: TransactionStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TransactionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    label: 'Transaction',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link');
    await expect(link).toHaveAttribute('href', expect.stringContaining('stellar.expert'));
  },
};

export const CertificateTransaction: Story = {
  args: {
    txHash: 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1',
    label: 'Certificate TX',
  },
};

export const ShortHash: Story = {
  args: {
    txHash: 'abc123',
  },
};
