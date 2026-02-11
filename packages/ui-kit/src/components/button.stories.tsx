import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "Primary action", variant: "primary" },
};

export const Secondary: Story = {
  args: { children: "Secondary action", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Ghost action", variant: "ghost" },
};

export const Small: Story = {
  args: { children: "Small", size: "sm" },
};

export const Medium: Story = {
  args: { children: "Medium", size: "md" },
};

export const Large: Story = {
  args: { children: "Large", size: "lg" },
};

export const Disabled: Story = {
  args: { children: "Disabled", disabled: true },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm">
          Primary sm
        </Button>
        <Button variant="primary" size="md">
          Primary md
        </Button>
        <Button variant="primary" size="lg">
          Primary lg
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm">
          Secondary sm
        </Button>
        <Button variant="secondary" size="md">
          Secondary md
        </Button>
        <Button variant="secondary" size="lg">
          Secondary lg
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm">
          Ghost sm
        </Button>
        <Button variant="ghost" size="md">
          Ghost md
        </Button>
        <Button variant="ghost" size="lg">
          Ghost lg
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled>
          Disabled primary
        </Button>
        <Button variant="secondary" disabled>
          Disabled secondary
        </Button>
        <Button variant="ghost" disabled>
          Disabled ghost
        </Button>
      </div>
    </div>
  ),
};
