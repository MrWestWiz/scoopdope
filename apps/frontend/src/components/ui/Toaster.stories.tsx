import type { Meta, StoryObj } from '@storybook/react';
import { Toaster } from './Toaster';
import { useToastStore } from '@/lib/toast';

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      useToastStore.setState({ toasts: [] });
      return <Story />;
    },
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToasterWithSuccess() {
  useToastStore.setState({
    toasts: [{ id: '1', message: 'Course enrolled successfully!', type: 'success' }],
  });
  return <Toaster />;
}

function ToasterWithError() {
  useToastStore.setState({
    toasts: [{ id: '2', message: 'Payment failed. Please try again.', type: 'error' }],
  });
  return <Toaster />;
}

function ToasterWithInfo() {
  useToastStore.setState({
    toasts: [{ id: '3', message: 'New course materials available.', type: 'info' }],
  });
  return <Toaster />;
}

function ToasterWithMultiple() {
  useToastStore.setState({
    toasts: [
      { id: '4', message: 'Welcome back!', type: 'success' },
      { id: '5', message: 'Your session will expire soon.', type: 'info' },
      { id: '6', message: 'Unable to sync progress.', type: 'error' },
    ],
  });
  return <Toaster />;
}

export const Success: Story = {
  render: () => <ToasterWithSuccess />,
};

export const Error: Story = {
  render: () => <ToasterWithError />,
};

export const Info: Story = {
  render: () => <ToasterWithInfo />,
};

export const Multiple: Story = {
  render: () => <ToasterWithMultiple />,
};
