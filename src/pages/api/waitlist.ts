import type { APIRoute } from "astro";
import { DomainError } from "../../domain/drop";
import {
  acceptsSignups,
  MIN_FILL_MS,
  storefrontCommandSchema,
} from "../../domain/waitlist";
import { t } from "../../locales/en";
import { caller, readInstallation } from "../../server/storage";
import { sendConfirmation } from "../../server/email";
import { handle, readBody } from "../../server/http";
import { consumeSignupAttempt, join, leave } from "../../server/waitlist";

// Storefront signup and self-service unsubscribe. Responses never include counts or emails.
export const POST: APIRoute = ({ request }) =>
  handle(async () => {
    const { scope, subjectId } = await caller();
    const command = storefrontCommandSchema.parse(await readBody(request));
    const now = Date.now();
    if (command.action === "leave") {
      await leave(scope, command.dropId, command.id, command.token, now);
      return { status: "left" };
    }
    // Likely automation: answer like a success without storing anything.
    if (command.website || command.elapsedMs < MIN_FILL_MS)
      return { status: "joined" };
    if (!(await consumeSignupAttempt(scope, subjectId || "anonymous", now)))
      throw new DomainError("rateLimited", 429);
    const installation = await readInstallation(scope, true);
    const drop = installation?.state.drops.find(
      (candidate) => candidate.id === command.dropId,
    );
    if (!installation || !drop || !acceptsSignups(drop, now))
      throw new DomainError("waitlistClosed", 409);
    const result = await join(
      scope,
      drop.id,
      command.email,
      t("waitlistConsent"),
      now,
    );
    if (result.status === "joined") {
      const productId =
        command.productId && drop.productIds.includes(command.productId)
          ? command.productId
          : drop.productIds[0]!;
      await sendConfirmation({
        scope,
        catalogVersion: installation.catalogVersion,
        drop,
        productId,
        entryId: result.id,
        email: command.email,
        seed: result.token,
      });
    }
    return result;
  });
