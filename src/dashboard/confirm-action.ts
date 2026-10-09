import { z } from "zod";
import type { LanguageCode } from "../locales/languages";

export const confirmActionModalId = "2f098d85-c59e-4d19-be77-4b8f76e48228";

export type ConfirmKind = "cancel" | "delete" | "start";
export interface ConfirmActionParams {
  locale?: LanguageCode;
  kind: ConfirmKind;
  name: string;
  // The drop still gates checkout, so deleting it reopens purchasing at once.
  active: boolean;
}

export const confirmActionResultSchema = z.object({
  confirmed: z.literal(true),
});
