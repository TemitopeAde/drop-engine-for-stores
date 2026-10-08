// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { defaultWidgetSettings } from "../src/domain/widget-settings";
import { useWidgetSettings } from "../src/extensions/site/plugins/drop-countdown/use-widget-settings";
import DropCountdown from "../src/extensions/site/plugins/drop-countdown/drop-countdown";
const editor = vi.hoisted(() => ({
  getProp: vi.fn(),
  setProp: vi.fn(),
  setPreloadFonts: vi.fn(),
}));
const client = vi.hoisted(() => ({ fetchWithAuth: vi.fn() }));
vi.mock("@wix/editor", () => ({ widget: editor }));
vi.mock("@wix/essentials", () => ({ httpClient: client }));
let stored: string;
beforeEach(() => {
  vi.clearAllMocks();
  stored = JSON.stringify(defaultWidgetSettings);
  editor.getProp.mockImplementation(async () => stored);
  editor.setProp.mockImplementation(async (_key: string, value: string) => {
    stored = value;
  });
  editor.setPreloadFonts.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});
it("applies every panel setting immediately, keeps rapid picker edits, and restores defaults", async () => {
  const { result, unmount } = renderHook(useWidgetSettings);
  await waitFor(() => expect(result.current.ready).toBe(true));
  act(() => {
    result.current.update({
      font: "italic 700 24px Georgia",
      textDecoration: "underline",
    });
    result.current.change("background", "#102030");
    result.current.change("textColor", "#ffffff");
    result.current.update({
      headline: "New launch",
      padding: 40,
      gap: 30,
      radius: 20,
      maxWidth: 800,
      compact: false,
      showName: false,
      showSeconds: false,
    });
  });
  await waitFor(() => expect(result.current.busy).toBe(false));
  const expected = {
    ...defaultWidgetSettings,
    font: "italic 700 24px Georgia",
    textDecoration: "underline",
    background: "#102030",
    textColor: "#ffffff",
    headline: "New launch",
    padding: 40,
    gap: 30,
    radius: 20,
    maxWidth: 800,
    compact: false,
    showName: false,
    showSeconds: false,
  };
  expect(JSON.parse(stored)).toEqual(expected);
  expect(editor.setPreloadFonts).toHaveBeenCalledTimes(1);
  unmount();
  const reopened = renderHook(useWidgetSettings);
  await waitFor(() =>
    expect(reopened.result.current.settings).toEqual(expected),
  );
  act(() => reopened.result.current.reset());
  await waitFor(() =>
    expect(JSON.parse(stored)).toEqual(defaultWidgetSettings),
  );
});
it("reports a failed write and can save again", async () => {
  const { result } = renderHook(useWidgetSettings);
  await waitFor(() => expect(result.current.ready).toBe(true));
  editor.setProp.mockRejectedValueOnce(new Error("offline"));
  act(() => result.current.change("headline", "Retry me"));
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(JSON.parse(stored).headline).toBe("");
  expect(result.current.message).toBeTruthy();
  act(() => result.current.save());
  await waitFor(() => expect(JSON.parse(stored).headline).toBe("Retry me"));
});
it("renders changed fonts, colors, spacing and visibility without replacing the waitlist form", async () => {
  if (!customElements.get("test-drop-countdown"))
    customElements.define("test-drop-countdown", DropCountdown);
  client.fetchWithAuth.mockResolvedValue(
    new Response(
      JSON.stringify({
        serverNow: 1000,
        drop: {
          id: "drop",
          name: "Launch",
          phase: "SCHEDULED",
          startsAt: 61000,
          endsAt: 121000,
          waitlist: true,
        },
      }),
    ),
  );
  const element = document.createElement("test-drop-countdown");
  element.setAttribute("product-id", "product");
  document.body.append(element);
  await waitFor(() =>
    expect(element.querySelector("input[type=email]")).toBeTruthy(),
  );
  const input = element.querySelector<HTMLInputElement>("input[type=email]")!;
  input.value = "visitor@example.com";
  element.setAttribute(
    "drop-settings",
    JSON.stringify({
      ...defaultWidgetSettings,
      font: "italic 700 24px Georgia",
      textColor: "#ffffff",
      background: "#102030",
      headline: "Custom",
      padding: 40,
      gap: 30,
      radius: 20,
      maxWidth: 800,
      compact: false,
      showName: false,
      showSeconds: false,
    }),
  );
  const root = element.querySelector("section")!;
  expect(root.style.fontFamily).toBe("Georgia");
  expect(root.style.color).toBe("rgb(255, 255, 255)");
  expect(root.style.background).toBe("rgb(16, 32, 48)");
  expect(root.style.padding).toBe("40px");
  expect(root.style.borderRadius).toBe("20px");
  expect(root.style.maxWidth).toBe("800px");
  expect(element.textContent).toContain("Custom");
  expect(element.textContent).not.toContain("Launch");
  expect(element.textContent).not.toContain("Seconds");
  expect(element.querySelector("h3")?.style.fontFamily).toBe("inherit");
  expect(element.querySelector("input[type=email]")).toBe(input);
  expect(input.value).toBe("visitor@example.com");
  element.remove();
});
