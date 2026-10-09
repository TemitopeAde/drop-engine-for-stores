import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, LoaderCircle, Mail, Send } from "lucide-react";
import type { Drop } from "../domain/drop";
import { waitlistEnabled, type EntryView } from "../domain/waitlist";
import { useTranslation } from "../locales/use-translation";
import { Button } from "../components/ui/button";
import {
  exportWaitlist,
  loadWaitlist,
  updateEntry,
  type WaitlistPage,
} from "./api";
import { WaitlistEmail, type EmailRecipients } from "./WaitlistEmail";

interface Props {
  drop: Drop;
  back: () => void;
}
const formatDate = (value: number, timeZone: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(value);

export function Waitlist({ drop, back }: Props) {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<WaitlistPage>();
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  // Kept across pages so a merchant can pick recipients from several pages.
  const [selected, setSelected] = useState<Map<string, EntryView>>(new Map());
  const [composing, setComposing] = useState<EmailRecipients | null>(null);
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setData(await loadWaitlist(drop.id, page, signal));
        setError("");
      } catch (err) {
        if (!signal?.aborted)
          setError(err instanceof Error ? err.message : t("failed"));
      }
    },
    [drop.id, page, t],
  );
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function change(action: "unsubscribe" | "remove", id: string) {
    setBusy(id);
    try {
      await updateEntry(action, drop.id, id);
      setConfirming(null);
      deselect([id]);
      toast.success(t("entryUpdated"));
      // Step back if deleting emptied the last page.
      if (action === "remove" && data?.entries.length === 1 && page > 0)
        setPage(page - 1);
      else await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }
  function deselect(ids: string[]) {
    setSelected((current) => {
      const next = new Map(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }
  function toggle(entries: EntryView[], on: boolean) {
    if (!on) return deselect(entries.map((entry) => entry.id));
    setSelected((current) => {
      const next = new Map(current);
      entries.forEach((entry) => next.set(entry.id, entry));
      return next;
    });
  }
  async function download() {
    setBusy("export");
    try {
      const url = URL.createObjectURL(await exportWaitlist(drop.id));
      const link = document.createElement("a");
      link.href = url;
      link.download = `waitlist-${drop.name.replace(/[^\w-]+/g, "-")}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }
  if (composing)
    return (
      <WaitlistEmail
        drop={drop}
        recipients={composing}
        back={() => setComposing(null)}
        sent={() => {
          setComposing(null);
          setSelected(new Map());
          void refresh();
        }}
      />
    );
  const subscribedOnPage =
    data?.entries.filter((entry) => entry.status === "SUBSCRIBED") ?? [];
  const pageSelected =
    subscribedOnPage.length > 0 &&
    subscribedOnPage.every((entry) => selected.has(entry.id));
  return (
    <section className="de-form-page">
      <Button variant="ghost" onClick={back}>
        <ArrowLeft size={16} />
        {t("back")}
      </Button>
      <header className="de-header">
        <div>
          <span className="de-eyebrow">{t("waitlistFor")}</span>
          <h1>{drop.name}</h1>
          {data && (
            <p role="status">
              {data.subscribed.toLocaleString(locale)} {t("waitlistSubscribed")}{" "}
              · {data.total.toLocaleString(locale)} {t("waitlistTotal")}
              {data.cap !== null &&
                ` · ${data.used.toLocaleString(locale)} / ${data.cap.toLocaleString(locale)} ${t("waitlistUsage")}`}
            </p>
          )}
        </div>
        <div className="de-header-actions">
          <Button
            variant="outline"
            disabled={!data?.subscribed || busy !== null}
            onClick={() =>
              data && setComposing({ kind: "all", count: data.subscribed })
            }
          >
            <Mail size={16} />
            {t("emailAll")}
          </Button>
          <Button
            variant="outline"
            disabled={!data?.csvExport || !data.total || busy !== null}
            title={data && !data.csvExport ? t("proRequired") : undefined}
            onClick={() => void download()}
          >
            {busy === "export" ? (
              <LoaderCircle size={16} className="de-spin" />
            ) : (
              <Download size={16} />
            )}
            {t(busy === "export" ? "exporting" : "exportCsv")}
          </Button>
        </div>
      </header>
      {data && !data.csvExport && (
        <p className="de-footnote">{t("proRequired")}</p>
      )}
      {!waitlistEnabled(drop) && (
        <p className="de-footnote">{t("waitlistOff")}</p>
      )}
      <p className="de-footnote">
        <Mail size={15} />
        {t("emailHelp")}
      </p>
      <section className="de-card de-list">
        {selected.size > 0 && (
          <div className="de-toolbar de-selection-bar" role="status">
            <Button variant="ghost" onClick={() => setSelected(new Map())}>
              {t("clearSelection")}
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() =>
                setComposing({
                  kind: "selected",
                  entries: [...selected.values()],
                })
              }
            >
              <Send size={16} />
              {t("emailSelected")} ({selected.size.toLocaleString(locale)})
            </Button>
          </div>
        )}
        {error ? (
          <div className="de-state" role="alert">
            <p>{error}</p>
            <Button onClick={() => void refresh()}>{t("retry")}</Button>
          </div>
        ) : !data ? (
          <div className="de-state" role="status">
            <LoaderCircle className="de-spin" />
            <p>{t("loading")}</p>
          </div>
        ) : !data.entries.length ? (
          <div className="de-empty">
            <span className="de-empty-icon">
              <Mail size={34} />
            </span>
            <h2>{t("waitlistEmpty")}</h2>
            <p>{t("waitlistEmptyHelp")}</p>
          </div>
        ) : (
          <>
            <div className="de-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="de-select-cell">
                      <input
                        type="checkbox"
                        aria-label={t("selectPage")}
                        checked={pageSelected}
                        disabled={!subscribedOnPage.length}
                        onChange={(event) =>
                          toggle(subscribedOnPage, event.target.checked)
                        }
                      />
                    </th>
                    <th>{t("waitlistEmail")}</th>
                    <th>{t("waitlistJoinedAt")}</th>
                    <th>{t("waitlistStatus")}</th>
                    <th className="de-actions-cell">
                      <span className="de-sr-only">{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="de-select-cell">
                        <input
                          type="checkbox"
                          aria-label={`${t("selectEntry")}: ${entry.email}`}
                          checked={selected.has(entry.id)}
                          // Unsubscribed entries can't be emailed, so they can't be picked.
                          disabled={entry.status !== "SUBSCRIBED"}
                          onChange={(event) =>
                            toggle([entry], event.target.checked)
                          }
                        />
                      </td>
                      <td>{entry.email}</td>
                      <td>
                        {formatDate(entry.joinedAt, drop.timeZone, locale)}
                      </td>
                      <td>
                        <span
                          className={`de-badge de-badge-${entry.status === "SUBSCRIBED" ? "live" : "cancelled"}`}
                        >
                          {t(entry.status)}
                        </span>
                      </td>
                      <td className="de-actions-cell">
                        <div className="de-row-actions">
                          {entry.status === "SUBSCRIBED" && (
                            <Button
                              variant="ghost"
                              disabled={busy !== null}
                              aria-label={`${t("emailEntry")}: ${entry.email}`}
                              onClick={() =>
                                setComposing({
                                  kind: "selected",
                                  entries: [entry],
                                })
                              }
                            >
                              <Mail size={14} />
                              {t("emailEntry")}
                            </Button>
                          )}
                          {entry.status === "SUBSCRIBED" && (
                            <Button
                              variant="ghost"
                              disabled={busy !== null}
                              onClick={() =>
                                void change("unsubscribe", entry.id)
                              }
                            >
                              {t("markUnsubscribed")}
                            </Button>
                          )}
                          <Button
                            variant={
                              confirming === entry.id ? "danger" : "ghost"
                            }
                            disabled={busy !== null}
                            aria-label={`${t(confirming === entry.id ? "confirmRemove" : "removeEntry")}: ${entry.email}`}
                            onClick={() =>
                              confirming === entry.id
                                ? void change("remove", entry.id)
                                : setConfirming(entry.id)
                            }
                          >
                            {busy === entry.id && (
                              <LoaderCircle size={14} className="de-spin" />
                            )}
                            {t(
                              confirming === entry.id
                                ? "confirmRemove"
                                : "removeEntry",
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="de-product-pagination de-table-pagination">
              <Button
                variant="outline"
                disabled={page === 0 || busy !== null}
                onClick={() => setPage(page - 1)}
              >
                {t("previousPage")}
              </Button>
              <span>
                {t("productPage")} {page + 1}
              </span>
              <Button
                variant="outline"
                disabled={!data.hasNext || busy !== null}
                onClick={() => setPage(page + 1)}
              >
                {t("nextPage")}
              </Button>
            </div>
          </>
        )}
      </section>
      <p className="de-footnote">{t("removeHelp")}</p>
    </section>
  );
}
