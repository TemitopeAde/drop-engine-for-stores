import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Rocket,
  LoaderCircle,
  CalendarClock,
  CircleHelp,
  Search,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  loadDashboard,
  mutate,
  type DashboardData,
  type Command,
} from "../../../../dashboard/api";
import { DropForm } from "../../../../dashboard/DropForm";
import { DropActions } from "../../../../dashboard/DropActions";
import { Guide } from "../../../../dashboard/Guide";
import { PluginPlacementStatus } from "../../../../dashboard/PluginPlacementStatus";
import { BusinessManagerTheme } from "../../BusinessManagerTheme";
import { phase, type Drop } from "../../../../domain/drop";
import { t } from "../../../../locales/en";
import "../../../../dashboard/dashboard.css";
export default function Dashboard() {
  return (
    <BusinessManagerTheme>
      <DropDashboard />
    </BusinessManagerTheme>
  );
}

function DropDashboard() {
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Drop | "new" | null>(null);
  const [view, setView] = useState<"drops" | "guide">("drops");
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false),
    [now, setNow] = useState(Date.now());
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await loadDashboard(0, undefined, signal);
      setData(next);
      setError("");
    } catch (err) {
      if (!signal?.aborted)
        setError(err instanceof Error ? err.message : t("failed"));
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function action(drop: Drop, command: Command["action"]) {
    setBusy(true);
    try {
      await mutate({ action: command, id: drop.id, version: drop.version });
      toast.success(t("saved"));
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }
  const drops =
    data?.drops.filter(
      (drop) =>
        drop.name.toLowerCase().includes(search.toLowerCase()) &&
        (!status || phase(drop, now) === status),
    ) || [];
  return (
    <div className="de-app">
      <Toaster richColors position="bottom-right" />
      <aside className="de-sidebar">
        <div className="de-brand">
          <span className="de-brand-icon">
            <Rocket size={20} />
          </span>
          <span className="de-brand-name">{data?.siteName || t("site")}</span>
        </div>
        <nav>
          <Button
            variant="ghost"
            aria-current={view === "drops" && !editing ? "page" : undefined}
            onClick={() => {
              setEditing(null);
              setView("drops");
            }}
          >
            <CalendarClock size={18} />
            {t("drops")}
          </Button>
          <Button
            variant="ghost"
            aria-current={view === "guide" && !editing ? "page" : undefined}
            onClick={() => {
              setEditing(null);
              setView("guide");
            }}
          >
            <CircleHelp size={18} />
            {t("guide")}
          </Button>
        </nav>
        <div className="de-sidebar-footer">
          <span className="de-plan-dot" />
          {t("free")}
        </div>
      </aside>
      <main className="de-main">
        {view === "guide" && !editing ? (
          <Guide
            create={() => {
              setView("drops");
              setEditing("new");
            }}
          />
        ) : error ? (
          <section className="de-card de-state" role="alert">
            <h1>{t("unavailable")}</h1>
            <p>{error}</p>
            <Button onClick={() => void refresh()}>{t("retry")}</Button>
          </section>
        ) : !data ? (
          <div className="de-state" role="status">
            <LoaderCircle className="de-spin" />
            <p>{t("loading")}</p>
          </div>
        ) : editing ? (
          <DropForm
            drop={editing === "new" ? undefined : editing}
            data={data}
            back={() => setEditing(null)}
            saved={async () => {
              await refresh();
              setEditing(null);
            }}
          />
        ) : (
          <>
            <header className="de-header">
              <div>
                <span className="de-eyebrow">{t("stage")}</span>
                <h1>{t("drops")}</h1>
                <p>{t("subtitle")}</p>
              </div>
              <div className="de-header-actions">
                <Button variant="outline" onClick={() => setView("guide")}>
                  <CircleHelp size={17} />
                  {t("guide")}
                </Button>
                <Button onClick={() => setEditing("new")}>
                  <Plus size={17} />
                  {t("create")}
                </Button>
              </div>
            </header>
            <PluginPlacementStatus />
            <section className="de-card de-list">
              <div className="de-toolbar">
                <label className="de-search">
                  <Search size={17} />
                  <input
                    aria-label={t("search")}
                    placeholder={t("search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label={t("all")}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">{t("all")}</option>
                  {(
                    [
                      "DRAFT",
                      "SCHEDULED",
                      "LIVE",
                      "ENDED",
                      "CANCELLED",
                      "ARCHIVED",
                    ] as const
                  ).map((value) => (
                    <option value={value} key={value}>
                      {t(value)}
                    </option>
                  ))}
                </select>
              </div>
              {!drops.length ? (
                <div className="de-empty">
                  <span className="de-empty-icon">
                    <Rocket size={34} />
                  </span>
                  <h2>{t("empty")}</h2>
                  <p>{t("emptyHelp")}</p>
                  <Button onClick={() => setEditing("new")}>
                    <Plus size={16} />
                    {t("create")}
                  </Button>
                </div>
              ) : (
                <div className="de-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("name")}</th>
                        <th>{t("start")}</th>
                        <th>{t("end")}</th>
                        <th>{t("stage")}</th>
                        <th>
                          <span className="de-sr-only">{t("actions")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {drops.map((drop) => (
                        <tr key={drop.id}>
                          <td>
                            <button
                              className="de-link"
                              onClick={() => setEditing(drop)}
                            >
                              {drop.name}
                            </button>
                            <small>
                              {drop.productIds.length} {t("products")}
                            </small>
                          </td>
                          <td>
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: drop.timeZone,
                            }).format(drop.startsAt)}
                          </td>
                          <td>
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: drop.timeZone,
                            }).format(drop.endsAt)}
                          </td>
                          <td>
                            <span
                              className={`de-badge de-badge-${phase(drop, now).toLowerCase()}`}
                            >
                              {t(phase(drop, now))}
                            </span>
                          </td>
                          <td>
                            <div className="de-row-actions">
                              <DropActions
                                drop={drop}
                                busy={busy}
                                edit={() => setEditing(drop)}
                                action={(command) => void action(drop, command)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            <p className="de-footnote">
              <CalendarClock size={15} />
              {t("gatingHelp")}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
