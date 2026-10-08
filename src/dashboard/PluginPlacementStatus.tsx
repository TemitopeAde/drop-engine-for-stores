import { useCallback, useEffect, useId, useRef, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { LoaderCircle, Plus, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { DROP_COUNTDOWN_PLUGIN_ID } from "../domain/site-plugin";
import { t, type MessageKey } from "../locales/en";
import { isCountdownPlaced } from "./plugin-placement";

type PlacementState =
  | { status: "checking" | "adding" }
  | { status: "added" | "missing"; message?: MessageKey }
  | { status: "error"; message: MessageKey };

function addErrorMessage(error: unknown): MessageKey {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  if (code === 3006) return "pluginAddCancelled";
  if (code === 3007) return "pluginPublishFirst";
  if (code === 3001) return "pluginSlotOccupied";
  return "pluginAddFailed";
}

export function PluginPlacementStatus() {
  const titleId = useId();
  const requestId = useRef(0);
  const [state, setState] = useState<PlacementState>({ status: "checking" });

  const check = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState({ status: "checking" });
    try {
      const placed = await isCountdownPlaced();
      if (currentRequest === requestId.current)
        setState({ status: placed ? "added" : "missing" });
    } catch {
      if (currentRequest === requestId.current)
        setState({ status: "error", message: "pluginCheckFailed" });
    }
  }, []);

  useEffect(() => {
    void check();
    return () => {
      requestId.current++;
    };
  }, [check]);

  async function add() {
    if (state.status !== "missing") return;
    const currentRequest = ++requestId.current;
    setState({ status: "adding" });
    try {
      await dashboard.addSitePlugin(DROP_COUNTDOWN_PLUGIN_ID, {});
    } catch (error) {
      if (currentRequest === requestId.current)
        setState({ status: "missing", message: addErrorMessage(error) });
      return;
    }
    if (currentRequest !== requestId.current) return;
    try {
      const placed = await isCountdownPlaced();
      if (currentRequest === requestId.current)
        setState(
          placed
            ? { status: "added" }
            : { status: "missing", message: "pluginStillMissing" },
        );
    } catch {
      if (currentRequest === requestId.current)
        setState({ status: "error", message: "pluginConfirmationFailed" });
    }
  }

  const busy = state.status === "checking" || state.status === "adding";
  const statusLabel: MessageKey =
    state.status === "added"
      ? "pluginAdded"
      : state.status === "missing"
        ? "pluginNotAdded"
        : state.status === "adding"
          ? "pluginAdding"
          : state.status === "error"
            ? "pluginUnknown"
            : "pluginChecking";
  const help: MessageKey =
    "message" in state && state.message
      ? state.message
      : state.status === "added"
        ? "pluginAddedHelp"
        : state.status === "missing"
          ? "pluginMissingHelp"
          : "pluginCheckingHelp";

  return (
    <section
      className="de-card de-placement"
      aria-labelledby={titleId}
      aria-busy={busy}
    >
      <div className="de-placement-content">
        <div className="de-placement-heading">
          <h2 id={titleId}>{t("pluginPlacement")}</h2>
          <span
            className={`de-badge ${state.status === "added" ? "de-badge-live" : ""}`}
            role="status"
          >
            {busy && <LoaderCircle size={13} className="de-spin" aria-hidden />}
            {t(statusLabel)}
          </span>
        </div>
        <p aria-live="polite">{t(help)}</p>
      </div>
      <div className="de-placement-actions">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void check()}
        >
          <RefreshCw size={15} aria-hidden />
          {t("pluginCheck")}
        </Button>
        {(state.status === "missing" || state.status === "adding") && (
          <Button type="button" disabled={busy} onClick={() => void add()}>
            {state.status === "adding" ? (
              <LoaderCircle size={15} className="de-spin" aria-hidden />
            ) : (
              <Plus size={15} aria-hidden />
            )}
            {t(state.status === "adding" ? "pluginAdding" : "pluginAdd")}
          </Button>
        )}
      </div>
    </section>
  );
}
