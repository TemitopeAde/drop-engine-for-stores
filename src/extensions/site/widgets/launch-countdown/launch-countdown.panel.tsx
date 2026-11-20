import { useCallback, useEffect, useState, type ChangeEvent, type FC } from "react";
import { widget } from "@wix/editor";
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
  const [productId, setProductId] = useState("");
  const [headline, setHeadline] = useState("");

  useEffect(() => {
    void Promise.all([widget.getProp("product-id"), widget.getProp("headline")])
      .then(([storedProductId, storedHeadline]) => {
        setProductId(storedProductId || "");
        setHeadline(storedHeadline || "This drop opens soon");
      })
      .catch((error) => console.error("Failed to load countdown settings:", error));
  }, []);

  const update = useCallback(
    (key: "product-id" | "headline", value: string) => {
      if (key === "product-id") setProductId(value);
      else setHeadline(value);
      void widget.setProp(key, value).catch((error) =>
        console.error(`Failed to save ${key}:`, error),
      );
    },
    [],
  );

  const onProductIdChange = (event: ChangeEvent<HTMLInputElement>) =>
    update("product-id", event.target.value);
  const onHeadlineChange = (event: ChangeEvent<HTMLInputElement>) =>
    update("headline", event.target.value);

  return (
    <WixDesignSystemProvider>
      <SidePanel width="300" height="100vh">
        <SidePanel.Content noPadding stretchVertically>
          <SidePanel.Section title="Countdown content">
            <SidePanel.Field>
              <FormField label="Wix Stores product ID">
                <Input
                  type="text"
                  value={productId}
                  placeholder="Paste the product ID"
                  onChange={onProductIdChange}
                  aria-label="Wix Stores product ID"
                />
              </FormField>
              <Box marginTop="SP1">
                <Text size="tiny" secondary>
                  Use the product UUID from your Wix Stores catalog.
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
