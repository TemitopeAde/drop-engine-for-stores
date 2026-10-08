import { extensions } from "@wix/astro/builders";
import config from "./choose-products.config.ts";

export default extensions.dashboardModal({
  id: "3690aee7-3167-42ee-9bd2-5f58f296bc3a",
  title: config.title,
  width: config.width,
  height: config.height,
  component:
    "./extensions/dashboard/modals/choose-products/choose-products.tsx",
});
