import type { Meta, StoryObj } from "@storybook/react";
import { InfoPopover } from "./info-popover";

const meta: Meta<typeof InfoPopover> = {
  title: "Components/InfoPopover",
  component: InfoPopover,
  tags: ["autodocs"],
  argTypes: {
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoPopover>;

export const Default: Story = {
  args: {
    title: "Case Review Workflow",
    content:
      "Review cases assigned to your queue. Assess the evidence, update the classification if needed, and submit your determination. Each action is logged for audit purposes.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/case-review",
  },
};

export const WithoutLink: Story = {
  args: {
    title: "Saved Searches",
    content:
      "Save frequently-used search queries and filter combinations. Saved searches appear in the sidebar and can be shared with your team.",
  },
};

export const CustomLabel: Story = {
  args: {
    title: "Dossier Generation",
    content:
      "Dossiers compile all evidence for a case into a structured report suitable for law enforcement referral. Generation runs as a background job.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/dossiers",
    docLabel: "Read the dossier guide",
  },
};

export const InlineUsage: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span className="font-medium">Search Syntax</span>
      <InfoPopover
        title="Search Query Syntax"
        content='Use natural language or structured queries. Enclose exact phrases in quotes. Prefix entity searches with the type, e.g. "email:user@example.com". Boolean operators AND, OR, NOT are supported.'
        docUrl="https://docs.intelligenceforgood.org/book/guides/search"
      />
    </div>
  ),
};
