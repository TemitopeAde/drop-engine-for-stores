// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describePlan } from "../src/domain/plans";
import type { Drop } from "../src/domain/drop";
import { DropActions } from "../src/dashboard/DropActions";
import Dashboard from "../src/extensions/dashboard/pages/my-page/my-page";
import ConfirmModal from "../src/extensions/dashboard/modals/confirm-drop-action/confirm-drop-action";
configure({ asyncUtilTimeout: 5000 });
vi.setConfig({ testTimeout: 15000 });
const spies = vi.hoisted(() => ({
  loadDashboard: vi.fn(),
  loadDrops: vi.fn(),
  mutate: vi.fn(),
  openModal: vi.fn(),
  closeModal: vi.fn(),
  observeState: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("../src/dashboard/api", () => ({
  loadDashboard: spies.loadDashboard,
  loadDrops: spies.loadDrops,
  mutate: spies.mutate,
}));
vi.mock("@wix/dashboard", () => ({
  dashboard: {
    openModal: spies.openModal,
    closeModal: spies.closeModal,
    observeState: spies.observeState,
  },
}));
vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { success: spies.success, error: spies.error },
}));
vi.mock("../src/extensions/dashboard/BusinessManagerTheme", () => ({
  BusinessManagerTheme: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../src/dashboard/PluginPlacementStatus", () => ({
  PluginPlacementStatus: () => null,
}));
vi.mock("../src/dashboard/LanguageSelector", () => ({
  LanguageSelector: () => null,
}));
// Exercise app decisions and callbacks; the browser check uses the actual WDS controls.
vi.mock("@wix/design-system", () => ({
  IconButton: ({
    ariaLabel,
    disabled,
    onClick,
    children,
  }: {
    ariaLabel: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
  }) => (
    <button aria-label={ariaLabel} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  PopoverMenu: Object.assign(
    ({
      children,
      triggerElement,
    }: {
      children: ReactNode;
      triggerElement: (props: {
        toggle: () => void;
        close: () => void;
      }) => ReactNode;
    }) => (
      <div>
        {triggerElement({ toggle: () => {}, close: () => {} })}
        {children}
      </div>
    ),
    {
      MenuItem: ({
        text,
        disabled,
        onClick,
      }: {
        text: string;
        disabled: boolean;
        onClick: () => void;
      }) => (
        <button disabled={disabled} onClick={onClick}>
          {text}
        </button>
      ),
      Divider: () => null,
    },
  ),
  Loader: () => null,
  MessageModalLayout: ({
    title,
    content,
    primaryButtonText,
    primaryButtonOnClick,
    secondaryButtonText,
    secondaryButtonOnClick,
  }: {
    title: string;
    content: string;
    primaryButtonText: string;
    primaryButtonOnClick: () => void;
    secondaryButtonText: string;
    secondaryButtonOnClick: () => void;
  }) => (
    <div role="dialog">
      <h2>{title}</h2>
      <p>{content}</p>
      <button onClick={primaryButtonOnClick}>{primaryButtonText}</button>
      <button onClick={secondaryButtonOnClick}>{secondaryButtonText}</button>
    </div>
  ),
}));
const now = Date.now();
const drop: Drop = {
  id: "a937c9e8-a028-40f8-9a07-0f173b081c70",
  name: "Friday launch",
  productIds: ["64a99fa7-29a1-46e5-9018-26b340c28682"],
  localStart: "2099-10-09T12:00",
  localEnd: "2099-10-09T13:00",
  timeZone: "UTC",
  endBehavior: "RESTORE",
  startsAt: now + 86400000,
  endsAt: now + 90000000,
  updatedAt: now,
  version: 3,
  status: "PUBLISHED",
};
beforeEach(() => {
  vi.resetAllMocks();
  spies.loadDashboard.mockResolvedValue({
    drops: [drop],
    revision: 1,
    plan: describePlan({ isFree: true }, "i"),
    serverNow: now,
    timeZone: "UTC",
    catalogVersion: "V3_CATALOG",
    products: [],
    hasNext: false,
  });
  spies.loadDrops.mockResolvedValue({
    drops: [drop],
    total: 1,
    serverNow: now,
  });
  spies.mutate.mockResolvedValue(undefined);
  spies.openModal.mockReturnValue({ modalClosed: Promise.resolve(undefined) });
});
afterEach(cleanup);
async function openStart() {
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole("button", { name: "Start now" }));
}
describe("Start now dashboard", () => {
  it.each(["DRAFT", "CANCELLED", "ARCHIVED", "LIVE", "ENDED"])(
    "hides the action for %s",
    (status) => {
      const changed: Drop =
        status === "LIVE"
          ? { ...drop, startsAt: now }
          : status === "ENDED"
            ? { ...drop, startsAt: now - 1000, endsAt: now }
            : { ...drop, status: status as Drop["status"] };
      render(
        <DropActions
          drop={changed}
          now={now}
          busy={false}
          edit={vi.fn()}
          waitlist={vi.fn()}
          action={vi.fn()}
        />,
      );
      expect(screen.queryByRole("button", { name: "Start now" })).toBeNull();
    },
  );
  it("does not start when confirmation is dismissed", async () => {
    await openStart();
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Start now" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    expect(spies.openModal).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ kind: "start", name: drop.name }),
      }),
    );
    expect(spies.mutate).not.toHaveBeenCalled();
  });
  it("disables actions until confirmation and request complete, then refreshes", async () => {
    let confirm: (result: unknown) => void = () => {};
    spies.openModal.mockReturnValue({
      modalClosed: new Promise((resolve) => {
        confirm = resolve;
      }),
    });
    let complete: () => void = () => {};
    spies.mutate.mockReturnValue(
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
    );
    await openStart();
    const button = screen.getByRole("button", { name: "Start now" });
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(button);
    expect(spies.openModal).toHaveBeenCalledTimes(1);
    confirm({ confirmed: true });
    await waitFor(() =>
      expect(spies.mutate).toHaveBeenCalledWith({
        action: "start",
        id: drop.id,
        version: drop.version,
      }),
    );
    expect(button.hasAttribute("disabled")).toBe(true);
    spies.loadDrops.mockResolvedValue({
      drops: [{ ...drop, startsAt: now }],
      total: 1,
      serverNow: now,
    });
    spies.loadDashboard.mockResolvedValue({
      ...(await spies.loadDashboard.mock.results[0].value),
      drops: [{ ...drop, startsAt: now }],
      revision: 2,
    });
    complete();
    await waitFor(() =>
      expect(spies.success).toHaveBeenCalledWith("Launch started"),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Start now" })).toBeNull(),
    );
    expect(spies.loadDashboard).toHaveBeenCalledTimes(2);
  });
  it("shows server errors and re-enables actions", async () => {
    spies.openModal.mockReturnValue({
      modalClosed: Promise.resolve({ confirmed: true }),
    });
    spies.mutate.mockRejectedValue(new Error("Refresh and try again"));
    await openStart();
    await waitFor(() =>
      expect(spies.error).toHaveBeenCalledWith("Refresh and try again"),
    );
    expect(spies.success).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("button", { name: "Start now" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
  it.each([true, false])(
    "confirmation modal returns the choice: %s",
    (confirmed) => {
      spies.observeState.mockImplementation((callback) => {
        callback({ kind: "start", name: drop.name, active: true });
        return { disconnect: vi.fn() };
      });
      render(<ConfirmModal />);
      expect(
        screen.getByRole("heading", { name: "Start Friday launch now?" }),
      ).toBeTruthy();
      expect(
        screen.getByText(
          "Purchasing opens immediately. The configured end date and time stay unchanged.",
        ),
      ).toBeTruthy();
      fireEvent.click(
        screen.getByRole("button", {
          name: confirmed ? "Start now" : "Cancel",
        }),
      );
      if (confirmed)
        expect(spies.closeModal).toHaveBeenCalledWith({ confirmed: true });
      else expect(spies.closeModal).toHaveBeenCalledWith();
    },
  );
});
