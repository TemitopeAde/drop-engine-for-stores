import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Temporal } from "@js-temporal/polyfill";
import { ArrowLeft, LoaderCircle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";
import { httpClient } from "@wix/essentials";
import { z } from "zod";
import { toast } from "sonner";
import { dropInputSchema, type Drop, type DropInput } from "../domain/drop";
import { useTranslation } from "../locales/use-translation";
import { Button } from "../components/ui/button";
import { mutate, type DashboardData } from "./api";
import { planNames, usePlanSummary } from "./PlanBadge";
interface Props {
  drop?: Drop;
  data: DashboardData;
  back: () => void;
  saved: () => Promise<void>;
}
export function DropForm({ drop, data, back, saved }: Props) {
  const { t } = useTranslation();
  const planSummary = usePlanSummary(data.plan);
  const [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  const form = useForm<DropInput>({
    resolver: zodResolver(dropInputSchema),
    defaultValues: drop
      ? { ...drop, productIds: [] }
      : {
          name: "",
          description: "",
          imageUrl: "",
          imageAlt: "",
          productIds: [],
          localStart: "",
          localEnd: "",
          timeZone: data.timeZone,
          endBehavior: "RESTORE",
          waitlist: true,
        },
  });
  const imageUrl = form.watch("imageUrl");
  const timeZones = useMemo(
    () =>
      [
        ...new Set([
          "UTC",
          data.timeZone,
          drop?.timeZone ?? data.timeZone,
          ...Intl.supportedValuesOf("timeZone"),
        ]),
      ].sort(),
    [data.timeZone, drop?.timeZone],
  );
  async function uploadImage(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const ticket = await httpClient.fetchWithAuth(
        new URL("/api/media-upload", import.meta.url).href,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType: file.type }),
        },
      );
      if (!ticket.ok) throw new Error(t("failed"));
      const ticketBody = z
        .object({ uploadUrl: z.string().url() })
        .parse(await ticket.json());
      const uploaded = await fetch(ticketBody.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploaded.ok) throw new Error(t("failed"));
      const result = z
        .object({ file: z.object({ url: z.string().url() }) })
        .parse(await uploaded.json());
      form.setValue("imageUrl", result.file.url, { shouldDirty: true });
      toast.success("Image added to Wix Media Manager");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed"));
    } finally {
      setUploading(false);
    }
  }
  function setStartNow() {
    try {
      const localStart = Temporal.Now.zonedDateTimeISO(
        form.getValues("timeZone"),
      )
        .toPlainDateTime()
        .toString({ smallestUnit: "minute" });
      form.clearErrors("timeZone");
      form.setValue("localStart", localStart, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } catch {
      form.setError(
        "timeZone",
        { type: "validate", message: t("invalidSchedule") },
        { shouldFocus: true },
      );
      toast.error(t("invalidSchedule"));
    }
  }
  async function submit(input: DropInput, action: "save" | "publish") {
    if (busy || uploading) return;
    setBusy(true);
    try {
      await mutate({ action, id: drop?.id, version: drop?.version, input });
      toast.success(t("saved"));
      await saved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="de-form-page">
      <Button variant="ghost" onClick={back} disabled={busy || uploading}>
        <ArrowLeft size={16} />
        {t("back")}
      </Button>
      <div className="de-page-title">
        <h1>{t(drop ? "edit" : "create")}</h1>
        <p>{t("gatingHelp")}</p>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((input) => submit(input, "save"))}
      >
        <div className="de-form-grid">
          <div>
            <section className="de-card">
              <h2>{t("name")}</h2>
              <label className="de-field" htmlFor="drop-name">
                {t("name")}
                <input
                  id="drop-name"
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                  maxLength={100}
                />
              </label>
              {form.formState.errors.name && (
                <p className="de-error" role="alert">
                  {t("fieldsRequired")}
                </p>
              )}
              <label className="de-field" htmlFor="drop-description">
                Drop details
                <textarea
                  id="drop-description"
                  rows={4}
                  maxLength={500}
                  {...form.register("description")}
                  placeholder="Tell shoppers what makes this drop special."
                />
              </label>
              {(["localStart", "localEnd"] as const).map((field, index) => (
                <div className="de-field" key={field}>
                  <label htmlFor={field}>{t(index ? "end" : "start")}</label>
                  <div className="de-date-input">
                    <input
                      id={field}
                      type="datetime-local"
                      step="0.001"
                      {...form.register(field)}
                      aria-invalid={!!form.formState.errors[field]}
                    />
                    {field === "localStart" && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={setStartNow}
                      >
                        {t("now")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <label className="de-field" htmlFor="time-zone">
                {t("zone")}
                <select
                  id="time-zone"
                  {...form.register("timeZone")}
                  aria-invalid={!!form.formState.errors.timeZone}
                >
                  {timeZones.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="de-field" htmlFor="end-behavior">
                {t("endBehavior")}
                <select id="end-behavior" {...form.register("endBehavior")}>
                  <option value="RESTORE">{t("RESTORE")}</option>
                  <option value="BLOCK">{t("BLOCK")}</option>
                </select>
              </label>
              <label className="de-check" htmlFor="drop-waitlist">
                <input
                  id="drop-waitlist"
                  type="checkbox"
                  {...form.register("waitlist")}
                />
                <span>
                  {t("waitlistSetting")}
                  <small>{t("waitlistSettingHelp")}</small>
                </span>
              </label>
              {Object.keys(form.formState.errors).length > 0 && (
                <p className="de-error" role="alert">
                  {t("fieldsRequired")}
                </p>
              )}
            </section>
            <section className="de-card de-product-card">
              <div className="de-card-heading">
                <h2>Drop artwork</h2>
                <span>Optional · Wix Media Manager</span>
              </div>
              {imageUrl ? (
                <img
                  className="de-drop-art-preview"
                  src={imageUrl}
                  alt={form.getValues("imageAlt") || "Drop artwork preview"}
                />
              ) : (
                <div className="de-drop-art-empty">
                  <Rocket size={28} />
                  <span>Make this drop unmistakable with a launch image.</span>
                </div>
              )}
              <label className="de-field" htmlFor="drop-image">
                Image
              </label>
              <input
                id="drop-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={busy || uploading}
                onChange={(event) => void uploadImage(event.target.files?.[0])}
              />
              <label className="de-field" htmlFor="drop-image-alt">
                Image description
              </label>
              <input
                id="drop-image-alt"
                maxLength={160}
                {...form.register("imageAlt")}
                placeholder="Describe the image for screen readers"
              />
              {uploading && (
                <p role="status">Uploading image to Wix Media Manager…</p>
              )}
            </section>
          </div>
          <aside className="de-card de-launch-guide">
            <span className="de-eyebrow">{t("stage")}</span>
            <Rocket size={32} />
            <h2>{t("empty")}</h2>
            <p>{t("emptyHelp")}</p>
            <hr />
            <p>
              {t(planNames[data.plan.id])} · {planSummary}
            </p>
          </aside>
        </div>
        <div className="de-form-footer">
          <Button type="submit" variant="outline" disabled={busy || uploading}>
            {busy && <LoaderCircle size={16} className="de-spin" />}
            {t("save")}
          </Button>
          <Button
            type="button"
            disabled={busy || uploading}
            onClick={form.handleSubmit((input) => submit(input, "publish"))}
          >
            {busy && <LoaderCircle size={16} className="de-spin" />}
            <Rocket size={16} />
            {t("publish")}
          </Button>
        </div>
      </form>
    </section>
  );
}
