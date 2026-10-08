import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Temporal } from "@js-temporal/polyfill";
import { ArrowLeft, LoaderCircle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { toast } from "sonner";
import {
  dropInputSchema,
  heldProductIds,
  type Drop,
  type DropInput,
} from "../domain/drop";
import { useTranslation } from "../locales/use-translation";
import { Button } from "../components/ui/button";
import { mutate, type DashboardData } from "./api";
import {
  productPickerModalId,
  productPickerResultSchema,
} from "./product-picker";
interface Props {
  drop?: Drop;
  data: DashboardData;
  back: () => void;
  saved: () => Promise<void>;
}
export function DropForm({ drop, data, back, saved }: Props) {
  const { t, locale } = useTranslation();
  const [busy, setBusy] = useState(false),
    [selecting, setSelecting] = useState(false);
  const form = useForm<DropInput>({
    resolver: zodResolver(dropInputSchema),
    defaultValues: drop || {
      name: "",
      productIds: [],
      localStart: "",
      localEnd: "",
      timeZone: data.timeZone,
      endBehavior: "RESTORE",
      waitlist: true,
    },
  });
  const ids = form.watch("productIds");
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
  async function chooseProducts() {
    setSelecting(true);
    try {
      const { modalClosed } = dashboard.openModal({
        modalId: productPickerModalId,
        params: {
          locale,
          products: data.products,
          selectedIds: form.getValues("productIds"),
          lockedIds: [...heldProductIds(data.drops, drop?.id, data.serverNow)],
          hasNext: data.hasNext,
          cursor: data.cursor,
        },
      });
      const result = productPickerResultSchema.safeParse(await modalClosed);
      if (result.success) {
        form.setValue("productIds", result.data.productIds, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    } catch {
      toast.error(t("failed"));
    } finally {
      setSelecting(false);
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
    if (busy || selecting) return;
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
      <Button variant="ghost" onClick={back} disabled={busy || selecting}>
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
              {(["localStart", "localEnd"] as const).map((field, index) => (
                <div className="de-field" key={field}>
                  <label htmlFor={field}>{t(index ? "end" : "start")}</label>
                  <div className="de-date-input">
                    <input
                      id={field}
                      type="datetime-local"
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
                <h2>{t("products")}</h2>
                <span role="status">
                  {ids.length.toLocaleString(locale)} {t("selected")}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={busy || selecting}
                aria-haspopup="dialog"
                aria-expanded={selecting}
                onClick={() => void chooseProducts()}
              >
                {t("catalog")}
              </Button>
              {form.formState.errors.productIds && (
                <p className="de-error" role="alert">
                  {t("fieldsRequired")}
                </p>
              )}
            </section>
          </div>
          <aside className="de-card de-launch-guide">
            <span className="de-eyebrow">{t("stage")}</span>
            <Rocket size={32} />
            <h2>{t("empty")}</h2>
            <p>{t("emptyHelp")}</p>
            <hr />
            <p>{t("free")}</p>
          </aside>
        </div>
        <div className="de-form-footer">
          <Button type="submit" variant="outline" disabled={busy || selecting}>
            {busy && <LoaderCircle size={16} className="de-spin" />}
            {t("save")}
          </Button>
          <Button
            type="button"
            disabled={busy || selecting}
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
