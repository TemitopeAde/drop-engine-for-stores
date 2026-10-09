import { extensions } from "@wix/astro/builders";
import config from "./confirm-drop-action.config.ts";

export default extensions.dashboardModal({
  id: "2f098d85-c59e-4d19-be77-4b8f76e48228",
  title: config.title,
  width: config.width,
  height: config.height,
  component:
    "./extensions/dashboard/modals/confirm-drop-action/confirm-drop-action.tsx",
});
