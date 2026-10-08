// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { DropForm } from "../src/dashboard/DropForm";
const spies = vi.hoisted(() => ({
  mutate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../src/dashboard/api", () => ({ mutate: spies.mutate }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  cleanup();
  spies.mutate.mockClear();
});
const data = {
  drops: [],
  revision: 0,
  serverNow: 0,
  timeZone: "UTC",
  catalogVersion: "V3_CATALOG" as const,
  products: [
    { id: "4c8379c5-7609-4ae9-91ad-a22a052f1aa9", name: "Launch tee" },
  ],
  hasNext: false,
};
describe("merchant form", () => {
  it("blocks empty submissions and keeps the save label", async () => {
    render(
      <DropForm data={data} back={vi.fn()} saved={vi.fn()} more={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
    );
    expect(spies.mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeTruthy();
  });
  it("publishes validated fields and the selected product ID", async () => {
    const saved = vi.fn().mockResolvedValue(undefined);
    render(
      <DropForm data={data} back={vi.fn()} saved={saved} more={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Drop name"), {
      target: { value: "Friday launch" },
    });
    fireEvent.change(screen.getByLabelText("Starts"), {
      target: { value: "2026-10-09T12:00" },
    });
    fireEvent.change(screen.getByLabelText("Ends"), {
      target: { value: "2026-10-09T13:00" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Launch tee" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish drop" }));
    await waitFor(() =>
      expect(spies.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "publish",
          input: expect.objectContaining({
            name: "Friday launch",
            productIds: [data.products[0].id],
          }),
        }),
      ),
    );
    await waitFor(() => expect(saved).toHaveBeenCalled());
  });
});
