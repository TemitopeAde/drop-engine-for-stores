import type { APIRoute } from "astro";
import { files } from "@wix/media";
import { auth } from "@wix/essentials";
import { z } from "zod";
import { handle, readBody } from "../../server/http";
import { tenant } from "../../server/storage";

const uploadSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .regex(/^[\w .()-]+\.(png|jpe?g|webp|gif)$/i),
    mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  })
  .strict();

export const POST: APIRoute = ({ request }) =>
  handle(async () => {
    await tenant(true);
    const input = uploadSchema.parse(await readBody(request));
    // This elevated call requires SCOPE.DC-MEDIA.MANAGE-MEDIAMANAGER in Dev Center.
    const result = await auth.elevate(files.generateFileUploadUrl)(
      input.mimeType,
      {
        fileName: input.fileName,
      },
    );
    return { uploadUrl: result.uploadUrl };
  });
