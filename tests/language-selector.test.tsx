// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Dashboard from "../src/extensions/dashboard/pages/my-page/my-page";
import { languages } from "../src/locales/languages";
import {
  LANGUAGE_STORAGE_KEY,
  setLanguage,
} from "../src/locales/language-store";

const spies = vi.hoisted(() => ({
  loadDashboard: vi.fn(),
  mutate: vi.fn(),
  openModal: vi.fn(),
}));
vi.mock("../src/dashboard/api", () => ({
  loadDashboard: spies.loadDashboard,
  mutate: spies.mutate,
}));
vi.mock("@wix/site-plugins", () => ({
  plugins: {
    getPlacementStatus: vi.fn().mockResolvedValue({ placementStatuses: [] }),
  },
}));
vi.mock("@wix/dashboard", () => ({
  dashboard: { openModal: spies.openModal },
}));

const data = {
  drops: [],
  revision: 0,
  serverNow: 0,
  timeZone: "UTC",
  catalogVersion: "V3_CATALOG",
  products: [],
  hasNext: false,
};

beforeEach(() => {
  // WDS lazy icons use a CDN. Keep these interaction tests local and deterministic.
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            content: '<path d="M2 4l4 4 4-4" />',
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    ),
  );
  window.localStorage.clear();
  setLanguage("en");
  spies.loadDashboard.mockReset().mockResolvedValue(data);
  spies.mutate.mockReset();
  spies.openModal
    .mockReset()
    .mockReturnValue({ modalClosed: Promise.resolve(undefined) });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setLanguage("en");
});

async function choose(name: string, label = "Language") {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  fireEvent.click(await screen.findByRole("option", { name }));
}

describe("sidebar language selection", () => {
  it("offers all 20 languages and translates without losing unsaved fields", async () => {
    render(<Dashboard />);
    await screen.findByRole("heading", { name: "Drops", level: 1 });
    fireEvent.click(screen.getAllByRole("button", { name: "Create drop" })[0]);
    fireEvent.change(screen.getByLabelText("Drop name"), {
      target: { value: "My launch" },
    });
    fireEvent.change(screen.getByLabelText("Starts"), {
      target: { value: "2026-12-01T12:00" },
    });
    fireEvent.click(screen.getByRole("combobox", { name: "Language" }));
    const list = await screen.findByRole("listbox");
    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(20);
    for (const { name } of languages)
      expect(within(list).getByRole("option", { name })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Español" }));
    await screen.findByRole("heading", { name: "Crear lanzamiento", level: 1 });
    expect(screen.getByLabelText("Nombre del lanzamiento")).toHaveProperty(
      "value",
      "My launch",
    );
    expect(screen.getByLabelText("Inicio")).toHaveProperty(
      "value",
      "2026-12-01T12:00",
    );
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
    expect(document.documentElement.lang).toBe("es");
    fireEvent.click(screen.getByRole("button", { name: "Elegir productos" }));
    expect(spies.openModal).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ locale: "es" }),
      }),
    );
    expect(spies.mutate).not.toHaveBeenCalled();
  });

  it("switches Arabic direction and translates help, then returns to English", async () => {
    render(<Dashboard />);
    await screen.findByRole("heading", { name: "Drops", level: 1 });
    await choose("العربية");
    await screen.findByRole("heading", { name: "الإطلاقات", level: 1 });
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("main").parentElement?.dir).toBe("rtl");
    fireEvent.click(
      screen.getAllByRole("button", { name: "الدليل والأسئلة الشائعة" })[0],
    );
    await screen.findByRole("heading", { name: "كيف يعمل Drop Engine" });
    expect(screen.getByText("هل تظهر المنتجات قبل البداية؟")).toBeTruthy();
    await choose("English", "اللغة");
    await screen.findByRole("heading", { name: "How Drop Engine works" });
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("receives changes from another app iframe and safely handles an unsupported saved language", async () => {
    render(<Dashboard />);
    await screen.findByRole("heading", { name: "Drops", level: 1 });
    act(() => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, "ja");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: LANGUAGE_STORAGE_KEY,
          newValue: "ja",
        }),
      );
    });
    await screen.findByRole("heading", { name: "販売イベント", level: 1 });
    act(() => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, "unsupported");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: LANGUAGE_STORAGE_KEY,
          newValue: "unsupported",
        }),
      );
    });
    await screen.findByRole("heading", { name: "Drops", level: 1 });
  });

  it("still switches languages when browser storage is unavailable", async () => {
    render(<Dashboard />);
    await screen.findByRole("heading", { name: "Drops", level: 1 });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage denied");
    });
    await choose("Français");
    await screen.findByRole("heading", { name: "Lancements", level: 1 });
    expect(document.documentElement.lang).toBe("fr");
  });

  it("reads the saved selection when a fresh app session starts", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "ko");
    vi.resetModules();
    const freshStore = await import("../src/locales/language-store");
    expect(freshStore.getLanguage()).toBe("ko");
  });
});
