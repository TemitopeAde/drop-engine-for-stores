import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FC,
} from "react";
import { widget } from "@wix/editor";
import { httpClient } from "@wix/essentials";
import { z } from "zod";
import {
  Box,
  FormField,
  Input,
  SidePanel,
  Text,
  WixDesignSystemProvider,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";

const Panel: FC = () => {
  const [dropId, setDropId] = useState("");
  const [drops, setDrops] = useState<{ id: string; name: string }[]>([]);
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    void Promise.all([
      widget.getProp("drop-id"),
      widget.getProp("headline"),
      httpClient.fetchWithAuth(
        new URL(/* @vite-ignore */ "/api/drops?view=selector", import.meta.url)
          .href,
      ),
    ])
      .then(async ([storedDropId, storedHeadline, response]) => {
        setDropId(storedDropId || "");
        setHeadline(storedHeadline || "This drop opens soon");
        if (!response.ok) throw new Error("Could not load drops");
        setDrops(
          z
            .object({
              drops: z.array(z.object({ id: z.string(), name: z.string() })),
            })
            .parse(await response.json()).drops,
        );
      })
      .catch((error) =>
        console.error("Failed to load countdown settings:", error),
      );
  }, []);

  const update = useCallback((key: "drop-id" | "headline", value: string) => {
    if (key === "drop-id") setDropId(value);
    else setHeadline(value);
    void widget
      .setProp(key, value)
      .catch((error) => console.error(`Failed to save ${key}:`, error));
  }, []);

  const onDropChange = (event: ChangeEvent<HTMLSelectElement>) =>
    update("drop-id", event.target.value);
  const onHeadlineChange = (event: ChangeEvent<HTMLInputElement>) =>
    update("headline", event.target.value);

  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content noPadding stretchVertically>
          <SidePanel.Section title="Countdown content">
            <SidePanel.Field>
              <FormField label="Drop">
                <select
                  value={dropId}
                  onChange={onDropChange}
                  aria-label="Choose a drop"
                >
                  <option value="">Choose a published drop</option>
                  {drops.map((drop) => (
                    <option key={drop.id} value={drop.id}>
                      {drop.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <Box marginTop="SP1">
                <Text size="tiny" secondary>
                  Choose a drop created in Drop Studio. No store product is
                  needed.
                </Text>
              </Box>
            </SidePanel.Field>
            <SidePanel.Field>
              <FormField label="Headline">
                <Input
                  type="text"
                  value={headline}
                  maxLength={120}
                  onChange={onHeadlineChange}
                  aria-label="Headline"
                />
              </FormField>
            </SidePanel.Field>
          </SidePanel.Section>
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
