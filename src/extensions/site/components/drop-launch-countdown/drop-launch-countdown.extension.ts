import { extensions } from "@wix/astro/builders";
import { LAYOUT } from "@wix/react-component-schema";
import { withEditorElementDefaults } from "@wix/react-component-utils";
import merge from "deepmerge";
import { editorElement } from "./drop-launch-countdown.generated";
import { defaultProps } from "./drop-launch-countdown.props";
import componentUrl from "./component.tsx?url";
import componentPreviewUrl from "./component.preview.tsx?url";

const editorElementWithDefaults = withEditorElementDefaults(
  editorElement,
  defaultProps,
);

export default extensions.editorReactComponent({
  id: "d649fb42-2939-4c43-8d66-80b36d74dfd3",
  type: "drop_engine_for_stores.DropLaunchCountdown",
  displayName: "Drop launch countdown",
  description:
    "Display the server-verified launch window for a selected Wix Stores product, with editable heading and countdown styling.",
  editorElement: merge(editorElementWithDefaults, {
    actions: {
      dashboard: {
        hidden: false,
        displayName: "Manage drops",
        dashboardPageId: "4e5e25b3-90bd-48dc-8d94-307f14b1e5a0",
      },
    },
    presets: {
      default: {
        displayName: "Drop countdown",
        thumbnailUrl: "{{BASE_URL}}/drop-countdown-preset.svg",
      },
    },
    layout: {
      resizeDirection: LAYOUT.RESIZE_DIRECTION.horizontal,
      contentResizeDirection: LAYOUT.CONTENT_RESIZE_DIRECTION.vertical,
    },
  }),
  installation: {
    staticContainer: "HOMEPAGE",
    initialSize: {
      width: {
        sizingType: LAYOUT.SIZING_TYPE.pixels,
        pixels: 480,
      },
      height: {
        sizingType: LAYOUT.SIZING_TYPE.content,
      },
    },
  },
  resources: {
    client: {
      componentUrl,
    },
    editor: {
      componentUrl: componentPreviewUrl,
    },
  },
});
