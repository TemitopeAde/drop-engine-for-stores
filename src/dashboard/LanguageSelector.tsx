import { Dropdown, type DropdownLayoutValueOption } from "@wix/design-system";
import { languages, isLanguageCode } from "../locales/languages";
import { useTranslation } from "../locales/use-translation";

const options = languages.map(({ code, name }) => ({ id: code, value: name }));

export function LanguageSelector() {
  const { locale, direction, setLanguage, t } = useTranslation();
  return (
    <div className="de-language-selector">
      <label htmlFor="dashboard-language">{t("language")}</label>
      <Dropdown
        id="dashboard-language"
        ariaLabel={t("language")}
        selectedId={locale}
        options={options}
        size="small"
        rtl={direction === "rtl"}
        // Bottom of the sidebar on desktop, top bar on narrow screens: open toward the free space.
        popoverProps={{ placement: "auto-start", appendTo: "window" }}
        maxHeightPixels={280}
        onSelect={({ id }: DropdownLayoutValueOption) => {
          if (isLanguageCode(id)) setLanguage(id);
        }}
      />
    </div>
  );
}
