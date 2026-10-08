import { z } from "zod";
export const widgetSettingsSchema = z.object({
  headline: z.string().max(120).default(""),
  textColor: z.string().max(200).default("var(--wst-color-title, #17382c)"),
  background: z
    .string()
    .max(200)
    .default("var(--wst-color-fill-background-primary, #eff5f1)"),
  accentColor: z.string().max(200).default("var(--wst-color-action, #17382c)"),
  font: z
    .string()
    .max(500)
    .default("var(--wst-font-style-body-medium, normal 400 16px system-ui)"),
  textDecoration: z.enum(["none", "underline", "line-through"]).default("none"),
  padding: z.number().min(0).max(80).default(24),
  gap: z.number().min(0).max(48).default(16),
  radius: z.number().min(0).max(80).default(12),
  maxWidth: z.number().min(200).max(1600).default(640),
  align: z.enum(["start", "center"]).default("start"),
  compact: z.boolean().default(true),
  showSeconds: z.boolean().default(true),
  showName: z.boolean().default(true),
});
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;
export const defaultWidgetSettings = widgetSettingsSchema.parse({});
export function parseWidgetSettings(value: string | null) {
  try {
    return widgetSettingsSchema.parse(JSON.parse(value || "{}"));
  } catch {
    return defaultWidgetSettings;
  }
}
