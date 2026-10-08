// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { PluginPlacementStatus } from "../src/dashboard/PluginPlacementStatus";
import { DROP_COUNTDOWN_PLUGIN_ID } from "../src/domain/site-plugin";

const spies = vi.hoisted(() => ({
  getPlacementStatus: vi.fn(),
  addSitePlugin: vi.fn(),
}));
vi.mock("@wix/site-plugins", () => ({
  plugins: { getPlacementStatus: spies.getPlacementStatus },
}));
vi.mock("@wix/dashboard", () => ({
  dashboard: { addSitePlugin: spies.addSitePlugin },
}));

const placement = (placedInSlot: boolean) => ({
  placementStatuses: [{ pluginId: DROP_COUNTDOWN_PLUGIN_ID, placedInSlot }],
});

beforeEach(() => {
  spies.getPlacementStatus.mockReset().mockResolvedValue(placement(false));
  spies.addSitePlugin.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

async function renderMissing() {
  render(<PluginPlacementStatus />);
  return screen.findByRole("button", { name: "Add plugin" });
}

describe("countdown plugin placement", () => {
  it("checks the countdown's ID rather than another plugin's placement", async () => {
    spies.getPlacementStatus.mockResolvedValue({
      placementStatuses: [
        { pluginId: "another-plugin", placedInSlot: false },
        ...placement(true).placementStatuses,
      ],
    });
    render(<PluginPlacementStatus />);
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Added"),
    );
    expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
    expect(spies.addSitePlugin).not.toHaveBeenCalled();
  });

  it("offers Add when missing and can check a changed placement", async () => {
    await renderMissing();
    expect(screen.getByRole("status").textContent).toBe("Not added");
    spies.getPlacementStatus.mockResolvedValue(placement(true));
    fireEvent.click(screen.getByRole("button", { name: "Check placement" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Added"),
    );
    expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
  });

  it.each([
    {},
    { placementStatuses: [] },
    { placementStatuses: [{ pluginId: "another-plugin", placedInSlot: true }] },
    { placementStatuses: [{ pluginId: DROP_COUNTDOWN_PLUGIN_ID }] },
    {
      placementStatuses: [
        { pluginId: DROP_COUNTDOWN_PLUGIN_ID, placedInSlot: null },
      ],
    },
  ])(
    "keeps incomplete placement data unknown instead of offering Add (%j)",
    async (response) => {
      spies.getPlacementStatus.mockResolvedValue(response);
      render(<PluginPlacementStatus />);
      await waitFor(() =>
        expect(screen.getByRole("status").textContent).toBe("Unable to check"),
      );
      expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
    },
  );

  it("recovers from a failed status check without reporting Not added", async () => {
    spies.getPlacementStatus.mockRejectedValueOnce(
      new Error("Permission denied"),
    );
    render(<PluginPlacementStatus />);
    await screen.findByText(
      "Placement couldn't be checked. Try checking again.",
    );
    expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Check placement" }));
    await screen.findByRole("button", { name: "Add plugin" });
  });

  it("adds the configured plugin once and waits for Wix to confirm placement", async () => {
    let finishAdd!: () => void;
    let confirmPlacement!: (response: ReturnType<typeof placement>) => void;
    spies.addSitePlugin.mockReturnValue(
      new Promise<void>((resolve) => {
        finishAdd = resolve;
      }),
    );
    const addButton = await renderMissing();
    spies.getPlacementStatus.mockReturnValue(
      new Promise<ReturnType<typeof placement>>((resolve) => {
        confirmPlacement = resolve;
      }),
    );
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    expect(spies.addSitePlugin).toHaveBeenCalledTimes(1);
    expect(spies.addSitePlugin).toHaveBeenCalledWith(
      DROP_COUNTDOWN_PLUGIN_ID,
      {},
    );
    expect(
      screen
        .getByRole("button", { name: "Check placement" })
        .hasAttribute("disabled"),
    ).toBe(true);
    finishAdd();
    await waitFor(() =>
      expect(spies.getPlacementStatus).toHaveBeenCalledTimes(2),
    );
    expect(screen.getByRole("status").textContent).toBe("Adding plugin…");
    confirmPlacement(placement(true));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Added"),
    );
    expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
  });

  it("does not report success when placement is still missing after adding", async () => {
    fireEvent.click(await renderMissing());
    await screen.findByText(
      "The countdown isn't placed yet. Check again or try adding it again.",
    );
    expect(screen.getByRole("status").textContent).toBe("Not added");
    expect(
      screen
        .getByRole("button", { name: "Add plugin" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("allows rechecking when confirmation fails after the add request", async () => {
    const addButton = await renderMissing();
    spies.getPlacementStatus.mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    fireEvent.click(addButton);
    await screen.findByText(
      "The add request completed, but placement couldn't be checked. Check again to confirm.",
    );
    expect(screen.getByRole("status").textContent).toBe("Unable to check");
    expect(screen.queryByRole("button", { name: "Add plugin" })).toBeNull();
    spies.getPlacementStatus.mockResolvedValue(placement(true));
    fireEvent.click(screen.getByRole("button", { name: "Check placement" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Added"),
    );
  });

  it.each([
    [3006, "Adding the plugin was cancelled. You can try again."],
    [3007, "Publish your site first, then try adding the plugin again."],
    [
      3001,
      "The countdown's slot is occupied. Update the placement in the site editor, then check again.",
    ],
    [3003, "The plugin couldn't be added. Try again."],
  ])(
    "handles Wix's add failure %i and preserves the retry action",
    async (code, message) => {
      spies.addSitePlugin.mockRejectedValue({ code });
      fireEvent.click(await renderMissing());
      await screen.findByText(message);
      expect(screen.getByRole("status").textContent).toBe("Not added");
      expect(
        screen
          .getByRole("button", { name: "Add plugin" })
          .hasAttribute("disabled"),
      ).toBe(false);
    },
  );

  it("does not recheck after leaving the page while the add dialog is open", async () => {
    let finishAdd!: () => void;
    spies.addSitePlugin.mockReturnValue(
      new Promise<void>((resolve) => {
        finishAdd = resolve;
      }),
    );
    const { unmount } = render(<PluginPlacementStatus />);
    fireEvent.click(await screen.findByRole("button", { name: "Add plugin" }));
    unmount();
    finishAdd();
    await Promise.resolve();
    expect(spies.getPlacementStatus).toHaveBeenCalledTimes(1);
  });
});
