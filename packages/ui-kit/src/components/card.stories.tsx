import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    padded: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <p className="text-sm text-slate-500">Active cases</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900">42</p>
        <p className="mt-2 text-xs text-slate-400">+3 from last week</p>
      </div>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padded: false,
    children: (
      <div className="divide-y divide-slate-100">
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-slate-900">Row 1</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-slate-900">Row 2</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-slate-900">Row 3</p>
        </div>
      </div>
    ),
  },
};

export const MetricCards: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <p className="text-sm text-slate-500">Active cases</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900">42</p>
        <p className="mt-2 text-xs text-slate-400">+3 from last week</p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">Escalations</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900">7</p>
        <p className="mt-2 text-xs text-slate-400">-1 from last week</p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">Due today</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900">3</p>
        <p className="mt-2 text-xs text-slate-400">On track</p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">Pending review</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900">12</p>
        <p className="mt-2 text-xs text-slate-400">+5 from last week</p>
      </Card>
    </div>
  ),
};
