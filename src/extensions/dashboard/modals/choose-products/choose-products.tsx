import { useEffect, useState } from "react";
import { dashboard } from "@wix/dashboard";
import { CustomModalLayout, Loader } from "@wix/design-system";
import { BusinessManagerTheme } from "../../BusinessManagerTheme";
import { ProductSelector } from "../../../../dashboard/ProductSelector";
import type { ProductPickerParams } from "../../../../dashboard/product-picker";
import { t } from "../../../../locales/en";
import config from "./choose-products.config";
import "../../../../dashboard/dashboard.css";
import "./choose-products.css";

export default function ChooseProductsModal() {
  return (
    <BusinessManagerTheme>
      <ProductPicker />
    </BusinessManagerTheme>
  );
}

function ProductPicker() {
  const [picker, setPicker] = useState<ProductPickerParams>();
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const subscription = dashboard.observeState<ProductPickerParams>(
      (params) => {
        setPicker((current) => current ?? params);
      },
    );
    return () => subscription.disconnect();
  }, []);

  return (
    <CustomModalLayout
      width="100%"
      maxWidth={config.width}
      style={{ minWidth: 0 }}
      maxHeight={config.height}
      title={t("catalog")}
      showHeaderDivider={false}
      showFooterDivider={false}
      closeButtonProps={{
        size: "small",
        onClick: () => dashboard.closeModal(),
      }}
      primaryButtonText={t("done")}
      primaryButtonProps={{ disabled: !picker || selecting }}
      primaryButtonOnClick={() => {
        if (picker && !selecting)
          dashboard.closeModal({ productIds: picker.selectedIds });
      }}
      secondaryButtonText={t("dismiss")}
      secondaryButtonProps={{ skin: "dark" }}
      secondaryButtonOnClick={() => dashboard.closeModal()}
      content={
        picker ? (
          <div className="de-product-picker">
            <ProductSelector
              firstPage={picker}
              ids={picker.selectedIds}
              lockedIds={picker.lockedIds ?? []}
              disabled={false}
              onSelecting={setSelecting}
              onChange={(selectedIds) =>
                setPicker((current) =>
                  current ? { ...current, selectedIds } : current,
                )
              }
            />
          </div>
        ) : (
          <Loader text={t("loading")} />
        )
      }
    />
  );
}
