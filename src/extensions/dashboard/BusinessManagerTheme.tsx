import { useEffect, type ReactNode } from "react";
import {
  WixDesignSystemProvider,
  WixDesignSystemIconThemeProvider,
  WixDesignSystemDefaultPropsProvider,
  type WixDesignSystemDefaultProps,
} from "@wix/design-system";
import { IconThemeProvider } from "@wix/wix-ui-icons-common/core";
import { useTranslation } from "../../locales/use-translation";
import "@wix/design-system/styles.global.css";
import "@wix/design-system/themes/odeditor.global.css";

const defaults: WixDesignSystemDefaultProps = {
  Button: { size: "small", skin: "dark" },
  IconButton: { size: "small", skin: "dark", priority: "tertiary" },
  TextButton: { size: "small", skin: "standard" },
  Input: { size: "small" },
};

export function BusinessManagerTheme({ children }: { children: ReactNode }) {
  const { locale, direction } = useTranslation();
  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousDirection = document.documentElement.dir;
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    return () => {
      document.documentElement.lang = previousLanguage;
      document.documentElement.dir = previousDirection;
    };
  }, [locale, direction]);
  return (
    <WixDesignSystemProvider locale={locale}>
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
