import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ErrorFallback } from "./error-fallback";

const meta: Meta<typeof ErrorFallback> = {
  title: "Components/ErrorFallback",
  component: ErrorFallback,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorFallback>;

const mockError = Object.assign(new Error("Network request failed"), {
  digest: "abc123def456",
});

export const Default: Story = {
  args: {
    error: mockError,
    reset: fn(),
  },
};

export const CustomMessages: Story = {
  args: {
    error: mockError,
    reset: fn(),
    title: "Dashboard unavailable",
    description:
      "Unable to load the dashboard overview. The API may be temporarily unreachable.",
  },
};

export const WithoutDigest: Story = {
  args: {
    error: new Error("Something broke") as Error & { digest?: string },
    reset: fn(),
  },
};
