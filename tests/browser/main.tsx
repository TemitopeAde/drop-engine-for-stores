import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "../../src/extensions/dashboard/pages/my-page/my-page";
import Countdown from "../../src/extensions/site/components/drop-launch-countdown/drop-launch-countdown";
import ConfirmDropActionModal from "../../src/extensions/dashboard/modals/confirm-drop-action/confirm-drop-action";
import ChooseProductsModal from "../../src/extensions/dashboard/modals/choose-products/choose-products";
import { dashboard } from "./dashboard";
const editor = location.search.includes("editor");
const confirmAction = location.search.includes("confirmAction");
const productPicker = location.search.includes("productPicker");

function BrowserDashboard() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const show = () => {
      const host = window as Window & {
        dropEngineModal?: { params: { kind?: string } };
      };
      setConfirmation(!!host.dropEngineModal?.params.kind);
      setOpen(true);
    };
    const hide = () => setOpen(false);
    window.addEventListener("drop-engine-modal-open", show);
    window.addEventListener("drop-engine-modal-close", hide);
    return () => {
      window.removeEventListener("drop-engine-modal-open", show);
      window.removeEventListener("drop-engine-modal-close", hide);
    };
  }, []);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  return (
    <>
      <Dashboard />
      {open && (
        <dialog
          ref={dialog}
          aria-label={confirmation ? "Confirm drop action" : "Choose products"}
          style={{
            border: 0,
            padding: 0,
            width: 550,
            maxWidth: "calc(100vw - 32px)",
          }}
          onCancel={(event) => {
            event.preventDefault();
            dashboard.closeModal();
          }}
        >
          <iframe
            title={confirmation ? "Confirm drop action" : "Choose products"}
            src={confirmation ? "/?confirmAction" : "/?productPicker"}
            style={{ border: 0, width: "100%", height: 600, display: "block" }}
          />
        </dialog>
      )}
    </>
  );
}
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    confirmAction ? (
      <ConfirmDropActionModal />
    ) : productPicker ? (
      <ChooseProductsModal />
    ) : editor ? (
      <div id="container" style={{ width: 480, padding: 0, margin: 24 }}>
        <style>{".drop-launch-countdown{display:var(--display)}"}</style>
        <Countdown
          id="countdown"
          headline="The Friday collection is almost here"
          productId="4c8379c5-7609-4ae9-91ad-a22a052f1aa9"
        />
      </div>
    ) : (
      <BrowserDashboard />
    ),
  );
