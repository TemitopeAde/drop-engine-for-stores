// Browser verification only: simulate Wix's separate modal iframe and SDK lifecycle.
interface ModalHost {
  params: Record<string, unknown>;
  resolve: (data: unknown) => void;
}
const host = window.parent as Window & { dropEngineModal?: ModalHost };

export const dashboard = {
  openModal({
    params = {},
  }: {
    modalId: string;
    params?: Record<string, unknown>;
  }) {
    const modalClosed = new Promise<unknown>((resolve) => {
      host.dropEngineModal = { params: structuredClone(params), resolve };
      host.dispatchEvent(new Event("drop-engine-modal-open"));
    });
    return { modalClosed };
  },
  closeModal(data?: unknown) {
    host.dropEngineModal?.resolve(data);
    delete host.dropEngineModal;
    host.dispatchEvent(new Event("drop-engine-modal-close"));
  },
  observeState<T>(observer: (params: T) => void) {
    if (host.dropEngineModal) observer(host.dropEngineModal.params as T);
    return { disconnect() {} };
  },
};
