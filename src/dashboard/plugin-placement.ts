import { plugins } from "@wix/site-plugins";
import { DROP_COUNTDOWN_PLUGIN_ID } from "../domain/site-plugin";

export async function isCountdownPlaced(): Promise<boolean> {
  const { placementStatuses } = await plugins.getPlacementStatus();
  const placement = placementStatuses.find(
    ({ pluginId }) => pluginId === DROP_COUNTDOWN_PLUGIN_ID,
  );
  if (typeof placement?.placedInSlot !== "boolean") {
    throw new Error("The countdown plugin's placement status is unavailable.");
  }
  return placement.placedInSlot;
}
