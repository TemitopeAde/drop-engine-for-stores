// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import Countdown from "../src/extensions/site/components/drop-launch-countdown/drop-launch-countdown";
import { defaultProps } from "../src/extensions/site/components/drop-launch-countdown/drop-launch-countdown.props";
const client = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@wix/essentials", () => ({
  httpClient: { fetchWithAuth: client.fetch },
}));
it("renders deterministically on the server with a complete setup state", () => {
  const first = renderToString(<Countdown id="widget" {...defaultProps} />);
  expect(first).toBe(
    renderToString(<Countdown id="widget" {...defaultProps} />),
  );
  expect(first).toContain("Set a Wix Stores product ID");
  expect(first).toContain("drop-launch-countdown-heading");
  expect(client.fetch).not.toHaveBeenCalled();
});
it("reads the selected product and displays server-verified launch status", async () => {
  client.fetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        serverNow: 1000,
        drop: {
          id: "drop",
          name: "Launch",
          phase: "SCHEDULED",
          startsAt: 61000,
          endsAt: 121000,
        },
      }),
    ),
  );
  render(
    <Countdown
      id="live-widget"
      {...defaultProps}
      productId="4c8379c5-7609-4ae9-91ad-a22a052f1aa9"
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("This drop opens soon"),
  );
  expect(client.fetch.mock.calls[0][0]).toContain("productId=4c8379c5");
  expect(screen.getByText("Days")).toBeTruthy();
  cleanup();
});
