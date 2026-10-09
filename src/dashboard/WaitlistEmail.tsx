import { lazy, Suspense, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Send } from "lucide-react";
import type { Drop } from "../domain/drop";
import {
  MAX_SUBJECT_CHARS,
  messageFormats,
  messageText,
  type Message,
} from "../domain/message";
import {
  EMAIL_BATCH_SIZE,
  type Cursor,
  type EntryView,
} from "../domain/waitlist";
import { useTranslation } from "../locales/use-translation";
import { Button } from "../components/ui/button";
import { emailWaitlist } from "./api";
import "react-quill-new/dist/quill.snow.css";

// Quill touches the DOM on import, so it loads only when the composer opens.
const ReactQuill = lazy(() => import("react-quill-new"));
const modules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export type EmailRecipients =
  { kind: "all"; count: number } | { kind: "selected"; entries: EntryView[] };
interface Props {
  drop: Drop;
  recipients: EmailRecipients;
  back: () => void;
  sent: () => void;
}
type Progress = { sent: number; failed: number; skipped: number };

export function WaitlistEmail({ drop, recipients, back, sent }: Props) {
  const { t, locale } = useTranslation();
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [message, setMessage] = useState<Message>({ ops: [{ insert: "\n" }] });
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [sending, setSending] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // One ID per composed message: sending again after a failure never emails anyone twice.
  const broadcastId = useRef(crypto.randomUUID()).current;
  const total =
    recipients.kind === "all" ? recipients.count : recipients.entries.length;
  const ready = subject.trim() !== "" && messageText(message) !== "";

  async function send() {
    if (!ready) {
      setInvalid(true);
      setConfirming(false);
      return;
    }
    setSending(true);
    const tally: Progress = { sent: 0, failed: 0, skipped: 0 };
    setProgress({ ...tally });
    const batch = async (
      input: Parameters<typeof emailWaitlist>[0]["recipients"],
    ) => {
      const result = await emailWaitlist({
        dropId: drop.id,
        broadcastId,
        subject: subject.trim(),
        message,
        recipients: input,
      });
      tally.sent += result.sent;
      tally.failed += result.failed;
      tally.skipped += result.skipped;
      setProgress({ ...tally });
      return result.next;
    };
    try {
      if (recipients.kind === "all") {
        let after: Cursor | null | undefined;
        do after = await batch({ kind: "all", after: after ?? undefined });
        while (after);
      } else {
        const ids = recipients.entries.map((entry) => entry.id);
        for (let offset = 0; offset < ids.length; offset += EMAIL_BATCH_SIZE)
          await batch({
            kind: "selected",
            ids: ids.slice(offset, offset + EMAIL_BATCH_SIZE),
          });
      }
      if (tally.failed) toast.error(t("emailRetry"));
      else {
        toast.success(
          `${tally.sent.toLocaleString(locale)} ${t("emailSentCount")}`,
        );
        sent();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  return (
    <section className="de-form-page">
      <Button variant="ghost" onClick={back} disabled={sending}>
        <ArrowLeft size={16} />
        {t("back")}
      </Button>
      <div className="de-page-title">
        <span className="de-eyebrow">{drop.name}</span>
        <h1>{t("emailTitle")}</h1>
        <p>{t("emailFooterNote")}</p>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready) setInvalid(true);
          else if (confirming) void send();
          else setConfirming(true);
        }}
      >
        <section className="de-card">
          <div className="de-field">
            <span>{t("emailTo")}</span>
            <p className="de-recipients">
              {recipients.kind === "all"
                ? `${t("emailAllRecipients")} (${total.toLocaleString(locale)})`
                : recipients.entries.map((entry) => entry.email).join(", ")}
            </p>
          </div>
          <label className="de-field" htmlFor="email-subject">
            {t("emailSubject")}
            <input
              id="email-subject"
              value={subject}
              maxLength={MAX_SUBJECT_CHARS}
              disabled={sending}
              aria-invalid={invalid && !subject.trim()}
              onChange={(event) => {
                setSubject(event.target.value);
                setConfirming(false);
              }}
            />
          </label>
          <div className="de-field">
            <span id="email-message-label">{t("emailMessage")}</span>
            <div
              className="de-editor"
              aria-labelledby="email-message-label"
              aria-invalid={invalid && !messageText(message)}
            >
              <Suspense
                fallback={
                  <div className="de-state" role="status">
                    <LoaderCircle className="de-spin" />
                  </div>
                }
              >
                <ReactQuill
                  theme="snow"
                  value={html}
                  modules={modules}
                  formats={messageFormats}
                  readOnly={sending}
                  onChange={(value, _delta, _source, editor) => {
                    setHtml(value);
                    setMessage(editor.getContents() as Message);
                    setConfirming(false);
                  }}
                />
              </Suspense>
            </div>
          </div>
          {invalid && !ready && (
            <p className="de-error" role="alert">
              {t("emailRequired")}
            </p>
          )}
          {progress && (
            <p className="de-footnote" role="status">
              {sending && <LoaderCircle size={15} className="de-spin" />}
              {progress.sent.toLocaleString(locale)} /{" "}
              {total.toLocaleString(locale)} {t("emailSentCount")}
              {progress.failed > 0 &&
                ` · ${progress.failed.toLocaleString(locale)} ${t("emailFailedCount")}`}
              {progress.skipped > 0 &&
                ` · ${progress.skipped.toLocaleString(locale)} ${t("emailSkippedCount")}`}
            </p>
          )}
        </section>
        <div className="de-form-footer">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={sending}
          >
            {t("back")}
          </Button>
          <Button type="submit" disabled={sending || !total}>
            {sending ? (
              <LoaderCircle size={16} className="de-spin" />
            ) : (
              <Send size={16} />
            )}
            {t(
              sending
                ? "emailSending"
                : confirming
                  ? "emailConfirmSend"
                  : "emailSend",
            )}
            {!sending && ` (${total.toLocaleString(locale)})`}
          </Button>
        </div>
      </form>
    </section>
  );
}
