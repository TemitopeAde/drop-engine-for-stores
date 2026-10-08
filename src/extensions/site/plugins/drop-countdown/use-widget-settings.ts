import { useEffect, useRef, useState } from "react";
import { widget } from "@wix/editor";
import {
  defaultWidgetSettings,
  parseWidgetSettings,
  widgetSettingsSchema,
  type WidgetSettings,
} from "../../../../domain/widget-settings";
import { t } from "../../../../locales/en";

export function useWidgetSettings() {
  const [settings, setSettings] = useState(defaultWidgetSettings);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const current = useRef(settings);
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  const mounted = useRef(false);
  const loadedFont = useRef<string>();

  useEffect(() => {
    mounted.current = true;
    widget
      .getProp("drop-settings")
      .then((value) => {
        if (!mounted.current) return;
        current.current = parseWidgetSettings(value || null);
        setSettings(current.current);
        setReady(true);
      })
      .catch(() => {
        if (mounted.current) setMessage(t("failed"));
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  function persist(value: WidgetSettings) {
    const version = ++revision.current;
    setBusy(true);
    setMessage("");
    // Serialize writes: older picker callbacks must never overwrite newer edits.
    queue.current = queue.current
      .then(async () => {
        if (loadedFont.current !== value.font) {
          await widget.setPreloadFonts([value.font]);
          loadedFont.current = value.font;
        }
        const serialized = JSON.stringify(value);
        await widget.setProp("drop-settings", serialized);
        if ((await widget.getProp("drop-settings")) !== serialized)
          throw new Error("Settings were not persisted");
        if (mounted.current && version === revision.current)
          setMessage(t("settingsSaved"));
      })
      .catch(() => {
        if (mounted.current && version === revision.current)
          setMessage(t("failed"));
      })
      .finally(() => {
        if (mounted.current && version === revision.current) setBusy(false);
      });
  }

  function update(patch: Partial<WidgetSettings>) {
    const parsed = widgetSettingsSchema.safeParse({
      ...current.current,
      ...patch,
    });
    if (!ready || !parsed.success) return;
    current.current = parsed.data;
    setSettings(parsed.data);
    persist(parsed.data);
  }

  function change<K extends keyof WidgetSettings>(
    key: K,
    value: WidgetSettings[K],
  ) {
    update({ [key]: value });
  }

  return {
    settings,
    ready,
    busy,
    message,
    change,
    update,
    reset: () => update(defaultWidgetSettings),
    save: () => {
      if (ready) persist(current.current);
    },
  };
}
