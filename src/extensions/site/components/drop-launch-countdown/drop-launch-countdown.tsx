import { useEffect, useState, type FC } from "react";
import classNames from "classnames";
import { httpClient } from "@wix/essentials";
import {
  projectionSchema,
  type Projection,
} from "../../../../domain/projection";
import { t } from "../../../../locales/en";
import styles from "./drop-launch-countdown.module.css";
import type { DropLaunchCountdownProps } from "./drop-launch-countdown.props";
const DropLaunchCountdown: FC<DropLaunchCountdownProps> = (props) => {
  const { id, className, direction, productId, headline, elementProps } = props;
  const [snapshot, setSnapshot] = useState<{
    projection: Projection;
    synchronizedAt: number;
  }>();
  const [now, setNow] = useState(0),
    [error, setError] = useState(false);
  useEffect(() => {
    setSnapshot(undefined);
    setError(false);
    if (!productId) return;
    let active = true;
    let controller: AbortController | undefined;
    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      try {
        const url = new URL(
          /* @vite-ignore */ "/api/storefront",
          import.meta.url,
        );
        url.searchParams.set("productId", productId!);
        const response = await httpClient.fetchWithAuth(url.href, {
          signal: current.signal,
        });
        if (!response.ok) throw new Error("availability");
        const projection = projectionSchema.parse(await response.json());
        if (!active || current.signal.aborted) return;
        setSnapshot({ projection, synchronizedAt: performance.now() });
        setNow(projection.serverNow);
        setError(false);
      } catch {
        if (active && !current.signal.aborted) setError(true);
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 15_000);
    return () => {
      active = false;
      controller?.abort();
      clearInterval(interval);
    };
  }, [productId]);
  useEffect(() => {
    if (!snapshot) return;
    const tick = () =>
      setNow(
        snapshot.projection.serverNow +
          performance.now() -
          snapshot.synchronizedAt,
      );
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [snapshot]);
  const drop = snapshot?.projection.drop;
  const scheduled = !!drop && now < drop.startsAt,
    live = !!drop && now >= drop.startsAt && now < drop.endsAt;
  const seconds = drop
    ? Math.max(
        0,
        Math.floor(((scheduled ? drop.startsAt : drop.endsAt) - now) / 1000),
      )
    : 0;
  const parts = [
    Math.floor(seconds / 86400),
    Math.floor(seconds / 3600) % 24,
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  const status = error
    ? t("outageViolation")
    : !productId
      ? t("selectProduct")
      : !snapshot
        ? t("loading")
        : !drop
          ? t("noLaunch")
          : t(scheduled ? "opens" : live ? "live" : "ended");
  return (
    <section
      id={id}
      dir={direction}
      className={classNames(
        "drop-launch-countdown",
        styles.root,
        styles.fallbackDirection,
        className,
      )}
    >
      <h2
        {...elementProps?.heading}
        className={classNames(
          "drop-launch-countdown-heading",
          styles.heading,
          elementProps?.heading?.className,
        )}
      >
        {headline}
      </h2>
      <p
        {...elementProps?.status}
        className={classNames(
          "drop-launch-countdown-status",
          styles.status,
          elementProps?.status?.className,
        )}
        role="status"
      >
        {status}
      </p>
      <div
        {...elementProps?.countdown}
        className={classNames(
          "drop-launch-countdown-countdown",
          styles.countdown,
          elementProps?.countdown?.className,
        )}
        hidden={error || (!scheduled && !live)}
      >
        {(["days", "hours", "minutes", "seconds"] as const).map(
          (label, index) => (
            <div className={styles.unit} key={label}>
              <strong
                {...elementProps?.number}
                className={classNames(
                  "drop-launch-countdown-number",
                  styles.number,
                  elementProps?.number?.className,
                )}
              >
                {String(parts[index]).padStart(2, "0")}
              </strong>
              <span
                {...elementProps?.label}
                className={classNames(
                  "drop-launch-countdown-label",
                  styles.label,
                  elementProps?.label?.className,
                )}
              >
                {t(label)}
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
};
export default DropLaunchCountdown;
