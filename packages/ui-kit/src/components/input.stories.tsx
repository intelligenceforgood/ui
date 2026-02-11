import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search"],
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter a value…",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "intelligence@example.org",
    type: "email",
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search by entity, behaviour, or case ID",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="max-w-sm space-y-2">
      <label
        htmlFor="name-input"
        className="block text-sm font-medium text-slate-700"
      >
        Campaign name
      </label>
      <Input id="name-input" placeholder="e.g., Operation Sunrise" />
      <p className="text-xs text-slate-400">
        A human-readable name for the campaign.
      </p>
    </div>
  ),
};
