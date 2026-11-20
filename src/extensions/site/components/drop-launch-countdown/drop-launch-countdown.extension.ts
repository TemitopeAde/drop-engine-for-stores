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
    "Display a standalone product drop countdown with launch artwork, details, and countdown styling.",
  editorElement: merge(editorElementWithDefaults, {
    actions: {
      dashboard: {
        hidden: false,
        displayName: "Manage drops",
        dashboardPageId: "846f35c7-c343-4dfb-ab57-4120d2391193",
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
