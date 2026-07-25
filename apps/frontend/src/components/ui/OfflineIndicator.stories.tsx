import type { Meta, StoryObj } from '@storybook/react';
import { OfflineIndicator } from './OfflineIndicator';

const meta = {
  title: 'UI/OfflineIndicator',
  component: OfflineIndicator,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OfflineIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
