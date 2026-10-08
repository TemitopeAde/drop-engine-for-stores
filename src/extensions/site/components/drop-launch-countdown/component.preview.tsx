import type { ComponentProps, FC } from "react";
import {
  withDefaults,
  withFallbackPlaceholder,
  useIsEditMode,
} from "@wix/react-component-utils";
import Component from "./drop-launch-countdown";
import { defaultProps } from "./drop-launch-countdown.props";
const Preview: FC<ComponentProps<typeof Component>> = (props) => {
  const isEditMode = useIsEditMode();
  return <Component {...props} productId={isEditMode ? "" : props.productId} />;
};
export default withDefaults(
  withFallbackPlaceholder(Preview, {
    requiredDataFields: ["headline"],
    rootClassName: "drop-launch-countdown",
  }),
  defaultProps,
);
