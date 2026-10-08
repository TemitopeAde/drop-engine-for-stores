import type { A11y, Direction } from "@wix/editor-react-types";
import { t } from "../../../../locales/en";
export type DropLaunchCountdownProps = {
  id: string;
  className?: string;
  direction?: Direction;
  a11y?: A11y;
  /** Wix Stores product UUID. Availability is read from the current installation. */
  productId?: string;
  headline?: string;
  elementProps?: {
    heading?: { className?: string };
    status?: { className?: string };
    countdown?: { className?: string };
    number?: { className?: string };
    label?: { className?: string };
  };
};
export const defaultProps = {
  productId: "",
  headline: t("opens"),
} satisfies Omit<DropLaunchCountdownProps, "id" | "className">;
