import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
    children: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Default", variant: "default" },
};

export const Success: Story = {
  args: { children: "Verified", variant: "success" },
};

export const Warning: Story = {
  args: { children: "Pending review", variant: "warning" },
};

export const Danger: Story = {
  args: { children: "Critical", variant: "danger" },
};

export const Info: Story = {
  args: { children: "12 results", variant: "info" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
