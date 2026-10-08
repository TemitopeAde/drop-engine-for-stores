import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, Rocket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dropInputSchema, type Drop, type DropInput } from "../domain/drop";
import { t } from "../locales/en";
import { Button } from "../components/ui/button";
import { mutate, type DashboardData } from "./api";
interface Props {
  drop?: Drop;
  data: DashboardData;
  back: () => void;
  saved: () => Promise<void>;
  more: () => Promise<void>;
}
export function DropForm({ drop, data, back, saved, more }: Props) {
  const [busy, setBusy] = useState(false),
    [loadingMore, setLoadingMore] = useState(false);
  const form = useForm<DropInput>({
    resolver: zodResolver(dropInputSchema),
    defaultValues: drop || {
      name: "",
      productIds: [],
      localStart: "",
      localEnd: "",
      timeZone: data.timeZone,
      endBehavior: "RESTORE",
    },
  });
  const ids = form.watch("productIds");
  async function submit(input: DropInput, action: "save" | "publish") {
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
      <Button variant="ghost" onClick={back} disabled={busy}>
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
              <div className="de-field-pair">
                {(["localStart", "localEnd"] as const).map((field, index) => (
                  <label className="de-field" key={field} htmlFor={field}>
                    {t(index ? "end" : "start")}
                    <input
                      id={field}
                      type="datetime-local"
                      {...form.register(field)}
                      aria-invalid={!!form.formState.errors[field]}
                    />
                  </label>
                ))}
              </div>
              <label className="de-field" htmlFor="time-zone">
                {t("zone")}
                <input id="time-zone" {...form.register("timeZone")} />
              </label>
              <label className="de-field" htmlFor="end-behavior">
                {t("endBehavior")}
                <select id="end-behavior" {...form.register("endBehavior")}>
                  <option value="RESTORE">{t("RESTORE")}</option>
                  <option value="BLOCK">{t("BLOCK")}</option>
                </select>
              </label>
              {Object.keys(form.formState.errors).length > 0 && (
                <p className="de-error" role="alert">
                  {t("fieldsRequired")}
                </p>
              )}
            </section>
            <section className="de-card de-product-card">
              <div className="de-card-heading">
                <h2>{t("catalog")}</h2>
                <span>
                  {ids.length} {t("selected")}
                </span>
              </div>
              <fieldset disabled={busy}>
                <legend className="de-sr-only">{t("products")}</legend>
                {data.products.map((product) => (
                  <label className="de-product" key={product.id}>
                    <input
                      type="checkbox"
                      checked={ids.includes(product.id)}
                      onChange={(event) =>
                        form.setValue(
                          "productIds",
                          event.target.checked
                            ? [...ids, product.id]
                            : ids.filter((id) => id !== product.id),
                          { shouldValidate: true },
                        )
                      }
                    />
                    {product.image ? (
                      <img src={product.image} alt="" width={44} height={44} />
                    ) : (
                      <span
                        className="de-product-placeholder"
                        aria-hidden="true"
                      >
                        <Rocket size={18} />
                      </span>
                    )}
                    <span>{product.name}</span>
                  </label>
                ))}
                {!data.products.length && <p>{t("noProducts")}</p>}
              </fieldset>
              {data.hasNext && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    try {
                      await more();
                    } catch {
                      toast.error(t("failed"));
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore && (
                    <LoaderCircle className="de-spin" size={16} />
                  )}
                  {t("loadMore")}
                </Button>
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
            <p>{t("notificationsPending")}</p>
          </aside>
        </div>
        <div className="de-form-footer">
          <Button type="submit" variant="outline" disabled={busy}>
            {busy && <LoaderCircle size={16} className="de-spin" />}
            {t("save")}
          </Button>
          <Button
            type="button"
            disabled={busy}
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
