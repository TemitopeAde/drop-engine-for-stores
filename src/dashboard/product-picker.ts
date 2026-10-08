import { z } from "zod";
import type { DashboardData } from "./api";
import type { LanguageCode } from "../locales/languages";

export const productPickerModalId = "3690aee7-3167-42ee-9bd2-5f58f296bc3a";

export interface ProductPickerParams {
  locale?: LanguageCode;
  products: DashboardData["products"];
  selectedIds: string[];
  lockedIds: string[];
  hasNext: boolean;
  cursor?: string;
}

export const productPickerResultSchema = z.object({
  productIds: z.array(z.string()),
});
