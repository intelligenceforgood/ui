import type { Meta, StoryObj } from "@storybook/react";
import { HelpTooltip } from "./help-tooltip";

const meta: Meta<typeof HelpTooltip> = {
  title: "Components/HelpTooltip",
  component: HelpTooltip,
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof HelpTooltip>;

export const Default: Story = {
  args: {
    title: "Risk Score",
    content:
      "A composite score (0–100) derived from weighted classification axes. Higher scores indicate greater fraud likelihood.",
  },
};

export const WithoutTitle: Story = {
  args: {
    content: "Click to expand the full case timeline.",
  },
};

export const RightSide: Story = {
  args: {
    title: "Entity Filter",
    content:
      "Narrow results by matching exact values or prefixes across structured indicator stores.",
    side: "right",
  },
};

export const InlineUsage: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span>Classification</span>
      <HelpTooltip
        title="5-Axis Classification"
        content="Each case is classified across five fraud taxonomy axes: intent, channel, techniques, actions, and persona."
      />
    </div>
  ),
};
