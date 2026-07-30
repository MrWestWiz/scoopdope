import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import { MobileNav, BottomMobileNav } from './MobileNav';

const meta = {
  title: 'Layout/MobileNav',
  component: MobileNav,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile2',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MobileNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unauthenticated: Story = {
  args: {
    isAuthenticated: false,
    onLogout: () => {},
  },
};

export const Authenticated: Story = {
  args: {
    isAuthenticated: true,
    onLogout: () => {},
  },
};

export const MenuOpen: Story = {
  args: {
    isAuthenticated: true,
    onLogout: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByLabelText('Toggle mobile menu');
    await userEvent.click(toggle);
    const nav = canvas.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(nav).toBeVisible();
    const closeBtn = canvas.getByLabelText('Close menu');
    await expect(closeBtn).toBeInTheDocument();
  },
};

export const BottomNav: StoryObj<typeof meta> = {
  render: () => <BottomMobileNav />,
};
