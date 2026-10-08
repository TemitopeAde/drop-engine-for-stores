import { useEffect, useState, type ReactNode } from "react";
import { inputs } from "@wix/editor";
import {
  Box,
  Button,
  FillPreview,
  FormField,
  Input,
  SegmentedToggle,
  SidePanel,
  Slider,
  Text,
  TextButton,
  ToggleSwitch,
  WixDesignSystemProvider,
} from "@wix/design-system";
import { RevertReset } from "@wix/wix-ui-icons-common";
import "@wix/design-system/styles.global.css";
import {
  widgetSettingsSchema,
  type WidgetSettings,
} from "../../../../domain/widget-settings";
import { useWidgetSettings } from "./use-widget-settings";
import { t, type MessageKey } from "../../../../locales/en";
import { tp } from "../../../../locales/plugin.en";

type Tab = "settings" | "design";
type NumberKey = "padding" | "gap" | "radius" | "maxWidth";
type ToggleKey = "showName" | "showSeconds" | "compact";
type ColorKey = "textColor" | "background" | "accentColor";

// Theme tokens (var(--wst-…)) resolve on the site; the panel shows the fallback.
function fontLabel(font: string) {
  if (font.trim().startsWith("var(")) return tp("themeFont");
  const match = font.match(/(\d+(?:\.\d+)?px)(?:\/\S+)?\s+(.+)$/);
  if (!match) return tp("customFont");
  const family = match[2].split(",")[0].replace(/["']/g, "").trim();
  return `${family} · ${match[1]}`;
}

function Row({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <Box verticalAlign="middle" align="space-between" gap="SP2">
      <Box direction="vertical" style={{ flex: "1 1 auto", minWidth: 0 }}>
        <Text size="small" weight="normal">
          {label}
        </Text>
        {help && (
          <Text size="tiny" secondary>
            {help}
          </Text>
        )}
      </Box>
      {children}
    </Box>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  // Local draft keeps dragging and typing smooth; the setting is written once committed.
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = (raw: string | number) => {
    const next = Math.min(max, Math.max(min, Math.round(Number(raw))));
    if (Number.isFinite(next) && next !== value) onCommit(next);
    else setDraft(String(value));
  };
  return (
    <FormField label={label}>
      <Box verticalAlign="middle" gap="SP2">
        <Box direction="vertical" width="100%">
          <Slider
            min={min}
            max={max}
            step={step}
            value={Number(draft) || min}
            displayMarks={false}
            displayTooltip={false}
            disabled={disabled}
            onChange={(next) => setDraft(String(next))}
            onAfterChange={(next) => commit(next as number)}
          />
        </Box>
        <Box width="76px" minWidth="76px">
          <Input
            size="small"
            type="number"
            ariaLabel={label}
            value={draft}
            min={min}
            max={max}
            disabled={disabled}
            suffix={<Input.Affix>px</Input.Affix>}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commit(draft)}
            onEnterPressed={() => commit(draft)}
          />
        </Box>
      </Box>
    </FormField>
  );
}

export default function Panel() {
  const { settings, ready, busy, message, change, update, reset, save } =
    useWidgetSettings();
  const [tab, setTab] = useState<Tab>("settings");
  const disabled = !ready;
  const failed = message === t("failed");

  const toggle = (key: ToggleKey, label: string, help: string) => (
    <SidePanel.Field>
      <Row label={label} help={help}>
        <ToggleSwitch
          size="small"
          checked={settings[key]}
          disabled={disabled}
          onChange={(event) => change(key, event.target.checked)}
        />
      </Row>
    </SidePanel.Field>
  );
  const range = (
    key: NumberKey,
    label: MessageKey,
    min: number,
    max: number,
    step?: number,
  ) => (
    <SidePanel.Field>
      <RangeField
        label={t(label)}
        value={settings[key]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onCommit={(value) => change(key, value)}
      />
    </SidePanel.Field>
  );
  const color = (key: ColorKey, label: string) => (
    <SidePanel.Field>
      <Row label={label}>
        <Box width="30px" height="30px">
          <FillPreview
            fill={settings[key]}
            disabled={disabled}
            onClick={() =>
              inputs.selectColor(settings[key], {
                onChange: (value) => {
                  if (value) change(key, value);
                },
              })
            }
          />
        </Box>
      </Row>
    </SidePanel.Field>
  );
  const chooseFont = () =>
    inputs.selectFont(
      { font: settings.font, textDecoration: settings.textDecoration },
      {
        onChange: (value) => {
          if (!value) return;
          const parsed = widgetSettingsSchema
            .pick({ font: true, textDecoration: true })
            .safeParse(value);
          if (parsed.success) update(parsed.data);
        },
      },
    );

  const status = busy ? tp("saving") : message;
  const section = (title: string, body: ReactNode) => (
    <SidePanel.Section title={title}>{body}</SidePanel.Section>
  );

  return (
    <WixDesignSystemProvider>
      <SidePanel width="100%" height="100vh">
        <Box padding="SP3 SP4">
          <SegmentedToggle
            fullWidth
            size="small"
            selected={tab}
            ariaLabel={t("editor")}
            onClick={(_, value) => setTab(value as Tab)}
          >
            <SegmentedToggle.Button value="settings">
              {tp("tabSettings")}
            </SegmentedToggle.Button>
            <SegmentedToggle.Button value="design">
              {tp("tabDesign")}
            </SegmentedToggle.Button>
          </SegmentedToggle>
        </Box>
        <SidePanel.Divider />
        <SidePanel.Content noPadding>
          {tab === "settings" ? (
            <>
              {section(
                t("content"),
                <SidePanel.Field>
                  <FormField label={t("heading")}>
                    <Input
                      size="small"
                      ariaLabel={t("heading")}
                      placeholder={tp("headlinePlaceholder")}
                      value={settings.headline}
                      maxLength={120}
                      disabled={disabled}
                      onChange={(event) =>
                        change("headline", event.target.value)
                      }
                    />
                  </FormField>
                  <Box marginTop="SP1">
                    <Text size="tiny" secondary>
                      {tp("headlineHelp")}
                    </Text>
                  </Box>
                </SidePanel.Field>,
              )}
              {section(
                tp("display"),
                <>
                  {toggle("showName", tp("showName"), tp("showNameHelp"))}
                  {toggle(
                    "showSeconds",
                    t("showSeconds"),
                    tp("showSecondsHelp"),
                  )}
                </>,
              )}
            </>
          ) : (
            <>
              {section(
                t("typography"),
                <SidePanel.Field>
                  <Row label={t("font")} help={fontLabel(settings.font)}>
                    <Button
                      size="small"
                      priority="secondary"
                      disabled={disabled}
                      onClick={chooseFont}
                    >
                      {tp("changeFont")}
                    </Button>
                  </Row>
                </SidePanel.Field>,
              )}
              {section(
                t("colors"),
                <>
                  {color("textColor", t("textColor"))}
                  {color("background", t("background"))}
                  {color("accentColor", tp("accentColor"))}
                </>,
              )}
              {section(
                t("layout"),
                <>
                  <SidePanel.Field>
                    <FormField label={tp("alignment")}>
                      <SegmentedToggle
                        size="small"
                        selected={settings.align}
                        disabled={disabled}
                        ariaLabel={tp("alignment")}
                        onClick={(_, value) =>
                          change("align", value as WidgetSettings["align"])
                        }
                      >
                        <SegmentedToggle.Button value="start">
                          {tp("alignStart")}
                        </SegmentedToggle.Button>
                        <SegmentedToggle.Button value="center">
                          {tp("alignCenter")}
                        </SegmentedToggle.Button>
                      </SegmentedToggle>
                    </FormField>
                  </SidePanel.Field>
                  {range("radius", "radius", 0, 80)}
                </>,
              )}
              {section(
                tp("spacing"),
                <>
                  {range("padding", "padding", 0, 80)}
                  {range("gap", "gap", 0, 48)}
                </>,
              )}
              {section(
                tp("size"),
                <>
                  {range("maxWidth", "maxWidth", 200, 1600, 10)}
                  {toggle("compact", t("compact"), tp("compactHelp"))}
                </>,
              )}
            </>
          )}
        </SidePanel.Content>
        <SidePanel.Footer>
          <Box align="space-between" verticalAlign="middle" gap="SP2">
            <Box role="status" style={{ flex: "1 1 auto", minWidth: 0 }}>
              <Text
                size="tiny"
                skin={failed ? "error" : "standard"}
                secondary={!failed}
              >
                {status}
              </Text>
            </Box>
            {failed ? (
              <TextButton size="small" onClick={save}>
                {t("retry")}
              </TextButton>
            ) : (
              <TextButton
                size="small"
                prefixIcon={<RevertReset />}
                disabled={disabled}
                onClick={reset}
              >
                {t("reset")}
              </TextButton>
            )}
          </Box>
        </SidePanel.Footer>
      </SidePanel>
    </WixDesignSystemProvider>
  );
}
