// Frame-driven twin of the sonner success toast the dashboard shows
// (<Toaster richColors position="bottom-right" />, toast.success(t("saved"))).
// Sonner animates with CSS transitions on its own clock; here `enter` is 0..1 from t.
import { t } from "@app/locales/en";

/** `scale` matches the camera zoom, so the toast keeps the dashboard's proportions. */
export function Toast({ enter, scale = 1 }: { enter: number; scale?: number }) {
  if (enter <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 32 * scale,
        bottom: 32 * scale,
        scale: String(scale),
        transformOrigin: "100% 100%",
        width: 356,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: 16,
        borderRadius: 8,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 500,
        // sonner richColors success
        background: "#ecfdf3",
        border: "1px solid #bffcd9",
        color: "#008a2e",
        boxShadow: "0 4px 12px rgb(0 0 0 / .1)",
        opacity: enter,
        translate: `0 ${(1 - enter) * 100}%`,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ flex: "none" }}>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      {t("saved")}
    </div>
  );
}
