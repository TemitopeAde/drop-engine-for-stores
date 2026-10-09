import { useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { Loader, MessageModalLayout } from "@wix/design-system";
import { BusinessManagerTheme } from "../../BusinessManagerTheme";
import type { ConfirmActionParams } from "../../../../dashboard/confirm-action";
import { useTranslation } from "../../../../locales/use-translation";
import { isLanguageCode } from "../../../../locales/languages";

export default function ConfirmDropActionModal() {
  return (
    <BusinessManagerTheme>
      <ConfirmDropAction />
    </BusinessManagerTheme>
  );
}

function ConfirmDropAction() {
  const { t, locale, direction, setLanguage } = useTranslation();
  const [params, setParams] = useState<ConfirmActionParams>();

  useEffect(() => {
    const subscription = dashboard.observeState<ConfirmActionParams>((next) => {
      if (isLanguageCode(next.locale)) setLanguage(next.locale);
      setParams((current) => current ?? next);
    });
    return () => subscription.disconnect();
  }, [setLanguage]);

  if (!params) return <Loader text={t("loading")} />;
  const cancel = params.kind === "cancel";
  const start = params.kind === "start";
  return (
    <div lang={locale} dir={direction}>
      <MessageModalLayout
        skin={start ? "standard" : "destructive"}
        title={t(
          start ? "startTitle" : cancel ? "cancelTitle" : "deleteTitle",
        ).replace("{name}", params.name)}
        content={
          start
            ? t("startBody")
            : cancel
              ? t("cancelBody")
              : `${t("deleteBody")}${params.active ? ` ${t("deleteActiveBody")}` : ""}`
        }
        primaryButtonText={t(
          start ? "startNow" : cancel ? "cancel" : "deleteDrop",
        )}
        primaryButtonOnClick={() => dashboard.closeModal({ confirmed: true })}
        secondaryButtonText={t(cancel ? "keepDrop" : "dismiss")}
        secondaryButtonOnClick={() => dashboard.closeModal()}
        onCloseButtonClick={() => dashboard.closeModal()}
      />
    </div>
  );
}
