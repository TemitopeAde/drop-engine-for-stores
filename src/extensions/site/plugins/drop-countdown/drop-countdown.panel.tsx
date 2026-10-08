import { useEffect, useState } from "react";
import { widget, inputs } from "@wix/editor";
import {
  SidePanel,
  WixDesignSystemProvider,
  Input,
  FormField,
  Button,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import {
  defaultWidgetSettings,
  parseWidgetSettings,
  widgetSettingsSchema,
  type WidgetSettings,
} from "../../../../domain/widget-settings";
import { t, type MessageKey } from "../../../../locales/en";
const sections: MessageKey[] = [
  "content",
  "typography",
  "colors",
  "countdown",
  "layout",
  "borders",
  "responsive",
  "advanced",
];
export default function Panel() {
  const [settings, setSettings] = useState<WidgetSettings>(
    defaultWidgetSettings,
  );
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    widget
      .getProp("drop-settings")
      .then((value) => {
        if (active) {
          setSettings(parseWidgetSettings(value || null));
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setMessage(t("failed"));
      });
    return () => {
      active = false;
    };
  }, []);
  function change<K extends keyof WidgetSettings>(
    key: K,
    value: WidgetSettings[K],
  ) {
    setSettings((old) => ({ ...old, [key]: value }));
    setMessage("");
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const value = widgetSettingsSchema.parse(settings);
      // Wix replaces the preload list. This widget currently has a single font token.
      await widget.setPreloadFonts([value.font]);
      const serialized = JSON.stringify(value);
      await widget.setProp("drop-settings", serialized);
      if ((await widget.getProp("drop-settings")) !== serialized)
        throw new Error("persistence");
      setMessage(t("settingsSaved"));
    } catch {
      setMessage(t("failed"));
    } finally {
      setBusy(false);
    }
  }
  const number = (
    key: "padding" | "gap" | "radius" | "maxWidth",
    min: number,
    max: number,
  ) => (
    <FormField label={t(key)}>
      <Input
        ariaLabel={t(key)}
        type="number"
        value={String(settings[key])}
        min={min}
        max={max}
        disabled={busy || !ready}
        onChange={(event) => change(key, Number(event.target.value))}
      />
    </FormField>
  );
  const toggle = (
    key: "compact" | "showSeconds" | "showName",
    label: MessageKey,
  ) => (
    <label style={{ display: "flex", gap: 8, padding: "8px 0" }}>
      <input
        type="checkbox"
        checked={settings[key]}
        disabled={busy || !ready}
        onChange={(event) => change(key, event.target.checked)}
      />
      {t(label)}
    </label>
  );
  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content>
          <SidePanel.Field>
            <h2 style={{ fontSize: 18 }}>{t("editor")}</h2>
          </SidePanel.Field>
          {sections.map((section) => (
            <SidePanel.Field key={section}>
              <details open={section === "content"}>
                <summary
                  style={{
                    padding: "8px 0",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t(section)}
                </summary>
                <div style={{ padding: "12px 0", display: "grid", gap: 12 }}>
                  {section === "content" && (
                    <>
                      <FormField label={t("heading")}>
                        <Input
                          ariaLabel={t("heading")}
                          value={settings.headline}
                          disabled={busy || !ready}
                          onChange={(event) =>
                            change("headline", event.target.value)
                          }
                        />
                      </FormField>
                      {toggle("showName", "name")}
                    </>
                  )}
                  {section === "typography" && (
                    <Button
                      disabled={busy || !ready}
                      onClick={() =>
                        inputs.selectFont(
                          {
                            font: settings.font,
                            textDecoration: settings.textDecoration,
                          },
                          {
                            onChange: (value) => {
                              if (!value) return;
                              const parsed = widgetSettingsSchema.safeParse({
                                ...settings,
                                font: value.font,
                                textDecoration: value.textDecoration || "none",
                              });
                              if (parsed.success) setSettings(parsed.data);
                            },
                          },
                        )
                      }
                    >
                      {t("font")}
                    </Button>
                  )}
                  {section === "colors" &&
                    (["textColor", "background"] as const).map((key) => (
                      <Button
                        key={key}
                        disabled={busy || !ready}
                        onClick={() =>
                          inputs.selectColor(settings[key], {
                            onChange: (value) => {
                              if (value) change(key, value);
                            },
                          })
                        }
                      >
                        {t(key)}
                      </Button>
                    ))}
                  {section === "countdown" &&
                    toggle("showSeconds", "showSeconds")}
                  {section === "layout" && (
                    <>
                      {number("padding", 0, 80)}
                      {number("gap", 0, 48)}
                    </>
                  )}
                  {section === "borders" && number("radius", 0, 80)}
                  {section === "responsive" && (
                    <>
                      {number("maxWidth", 200, 1600)}
                      {toggle("compact", "compact")}
                    </>
                  )}
                  {section === "advanced" && (
                    <Button
                      disabled={busy || !ready}
                      onClick={() => setSettings(defaultWidgetSettings)}
                    >
                      {t("reset")}
                    </Button>
                  )}
                </div>
              </details>
            </SidePanel.Field>
          ))}
          <SidePanel.Field>
            <Button disabled={busy || !ready} onClick={() => void save()}>
              {t("saveSettings")}
            </Button>
            {busy && (
              <span role="status" aria-label={t("loading")}>
                {" "}
                …
              </span>
            )}
            <p role="status" style={{ fontSize: 12 }}>
              {message}
            </p>
          </SidePanel.Field>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
}
