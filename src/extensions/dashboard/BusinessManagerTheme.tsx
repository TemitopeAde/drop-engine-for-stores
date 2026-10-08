import type { ReactNode } from "react";
import {
  WixDesignSystemProvider,
  WixDesignSystemIconThemeProvider,
  WixDesignSystemDefaultPropsProvider,
  type WixDesignSystemDefaultProps,
} from "@wix/design-system";
import { IconThemeProvider } from "@wix/wix-ui-icons-common/core";
import "@wix/design-system/styles.global.css";
import "@wix/design-system/themes/odeditor.global.css";

const defaults: WixDesignSystemDefaultProps = {
  Button: { size: "small", skin: "dark" },
  IconButton: { size: "small", skin: "dark", priority: "tertiary" },
  TextButton: { size: "small", skin: "standard" },
  Input: { size: "small" },
};

export function BusinessManagerTheme({ children }: { children: ReactNode }) {
  return (
    <WixDesignSystemProvider locale="en">
      <WixDesignSystemIconThemeProvider>
        <IconThemeProvider theme="odeditor">
          <WixDesignSystemDefaultPropsProvider defaults={defaults}>
            {children}
          </WixDesignSystemDefaultPropsProvider>
        </IconThemeProvider>
      </WixDesignSystemIconThemeProvider>
    </WixDesignSystemProvider>
  );
}
