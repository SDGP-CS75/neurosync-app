import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import AppErrorBoundary from "../../components/AppErrorBoundary";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("test render failure");
  }

  return <Text>Recovered content</Text>;
}

describe("AppErrorBoundary", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders a recoverable fallback when a child throws", () => {
    render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try loading the app again" })).toBeTruthy();
  });

  it("retries rendering the child after the fallback action", () => {
    const { rerender } = render(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow />
      </AppErrorBoundary>
    );

    rerender(
      <AppErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </AppErrorBoundary>
    );
    fireEvent.press(screen.getByRole("button", { name: "Try loading the app again" }));

    expect(screen.getByText("Recovered content")).toBeTruthy();
  });
});
