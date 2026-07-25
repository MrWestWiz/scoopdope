import type { Meta, StoryObj } from '@storybook/react';
import { within, expect, userEvent } from '@storybook/test';
import { Select } from './Select';

const meta = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    options: [
      { value: 'option-1', label: 'Option 1' },
      { value: 'option-2', label: 'Option 2' },
      { value: 'option-3', label: 'Option 3' },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Select an option',
  },
};

export const WithError: Story = {
  args: {
    label: 'Category',
    error: 'Please select a category',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox');
    await expect(select).toBeInTheDocument();
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    const error = canvas.getByRole('alert');
    await expect(error).toHaveTextContent('Please select a category');
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Country',
    helperText: 'Select your country of residence',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled select',
    disabled: true,
  },
};

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox');
    await userEvent.selectOptions(select, 'option-2');
    await expect(select).toHaveValue('option-2');
  },
};
