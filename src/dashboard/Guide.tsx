import { useMemo, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import {
  Archive,
  ArrowRight,
  Ban,
  BookOpen,
  CalendarClock,
  ChevronDown,
  Copy,
  Hourglass,
  Lock,
  LockOpen,
  MessageCircleQuestion,
  Package,
  Pencil,
  Plus,
  Rocket,
  RotateCcw,
  Search,
  Settings2,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import type { FaqCategory } from "../locales/guide.en";
import { getGuide } from "../locales/translations";
import { useTranslation } from "../locales/use-translation";

const icons: Record<string, LucideIcon> = {
  create: Package,
  schedule: CalendarClock,
  after: Hourglass,
  publish: Rocket,
  storefront: Store,
  edit: Pencil,
  duplicate: Copy,
  cancel: Ban,
  archive: Archive,
  restore: RotateCcw,
};
const checkoutIcons = { open: LockOpen, locked: Lock, depends: Settings2 };
function Checkout({ state }: { state: keyof typeof checkoutIcons }) {
  const { locale } = useTranslation();
  const guide = getGuide(locale);
  const Icon = checkoutIcons[state];
  return (
    <span className={`de-checkout de-checkout-${state}`}>
      <Icon size={13} aria-hidden="true" />
      {guide.checkout[state]}
    </span>
  );
}

function SectionHeading({
  id,
  icon: Icon,
  title,
  help,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  help: string;
}) {
  return (
    <div className="de-section-heading">
      <span className="de-section-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{help}</p>
      </div>
    </div>
  );
}

export function Guide({ create }: { create: () => void }) {
  const { t, locale } = useTranslation();
  const guide = useMemo(() => getGuide(locale), [locale]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "">("");
  const [tab, setTab] = useState<"start" | "faq">("start");
  const [showAllFaq, setShowAllFaq] = useState(false);
  const questions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guide.faq.filter(
      (item) =>
        (!category || item.category === category) &&
        (!needle ||
          item.q.toLowerCase().includes(needle) ||
          item.a.toLowerCase().includes(needle)),
    );
  }, [query, category, guide]);
  const categories = Object.entries(guide.faqCategories) as [
    FaqCategory,
    string,
  ][];
  const visibleQuestions =
    query.trim() || category || showAllFaq ? questions : questions.slice(0, 5);

  return (
    <div className="de-guide">
      <section className="de-guide-hero">
        <div className="de-guide-hero-copy">
          <span className="de-eyebrow">
            <BookOpen size={12} aria-hidden="true" />
            {t("guideEyebrow")}
          </span>
          <h1>{t("guideTitle")}</h1>
          <p>{t("guideIntro")}</p>
          <div className="de-header-actions">
            <Button onClick={create}>
              <Plus size={17} />
              {t("create")}
            </Button>
          </div>
        </div>
      </section>

      <div className="de-guide-tabs" role="group" aria-label={t("guideTitle")}>
        <button
          type="button"
          aria-pressed={tab === "start"}
          onClick={() => setTab("start")}
        >
          {t("guideSteps")}
        </button>
        <button
          type="button"
          aria-pressed={tab === "faq"}
          onClick={() => setTab("faq")}
        >
          {t("faq")}
        </button>
      </div>

      {tab === "start" && (
        <>
          <section className="de-guide-section" aria-labelledby="guide-steps">
            <SectionHeading
              id="guide-steps"
              icon={Rocket}
              title={t("guideSteps")}
              help={t("guideStepsHelp")}
            />
            <ol className="de-steps de-steps-compact">
              {guide.steps.map((step, index) => {
                const Icon = icons[step.icon];
                return (
                  <li className="de-step" key={step.title}>
                    <div className="de-step-top">
                      <span className="de-step-icon" aria-hidden="true">
                        <Icon size={20} />
                      </span>
                      <span className="de-step-number">
                        {t("guideStep")} {index + 1}
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <details>
                      <summary>{t("guideReadMore")}</summary>
                      <p>{step.body}</p>
                    </details>
                  </li>
                );
              })}
            </ol>
            <details className="de-guide-gallery">
              <summary>{t("guideScreenshots")}</summary>
              <div className="de-guide-gallery-grid">
                {[
                  {
                    src: "/guide/create-drop.png",
                    caption: guide.steps[0].title,
                  },
                  {
                    src: "/guide/storefront-main.png",
                    caption: guide.steps[1].title,
                  },
                  {
                    src: "/guide/checkout-blocked.png",
                    caption: guide.lifecycle[1].body,
                  },
                  {
                    src: "/guide/product-countdown.png",
                    caption: guide.steps[4].title,
                  },
                  {
                    src: "/guide/widget-settings.png",
                    caption: guide.steps[4].body,
                  },
                  {
                    src: "/guide/waitlist.png",
                    caption: t("waitlist"),
                  },
                ].map((image) => (
                  <figure key={image.src}>
                    <img src={image.src} alt={image.caption} loading="lazy" />
                    <figcaption>{image.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </details>
          </section>

          <details className="de-guide-more">
            <summary>{t("guideMore")}</summary>
            <section
              className="de-guide-section"
              aria-labelledby="guide-lifecycle"
            >
              <SectionHeading
                id="guide-lifecycle"
                icon={CalendarClock}
                title={t("guideStatuses")}
                help={t("guideStatusesHelp")}
              />
              <ol className="de-lifecycle">
                {guide.lifecycle.map((stage) => (
                  <li key={stage.status}>
                    <span className="de-lifecycle-dot" aria-hidden="true" />
                    <span
                      className={`de-badge de-badge-${stage.status.toLowerCase()}`}
                    >
                      {t(stage.status)}
                    </span>
                    <p>{stage.body}</p>
                    <Checkout state={stage.checkout} />
                  </li>
                ))}
              </ol>
              <div className="de-side-paths">
                <span className="de-side-label">{t("guideSidePaths")}</span>
                {guide.sidePaths.map((stage) => (
                  <div className="de-side-path" key={stage.status}>
                    <span
                      className={`de-badge de-badge-${stage.status.toLowerCase()}`}
                    >
                      {t(stage.status)}
                    </span>
                    <p>{stage.body}</p>
                    <Checkout state={stage.checkout} />
                  </div>
                ))}
              </div>
            </section>

            <section
              className="de-guide-section"
              aria-labelledby="guide-actions"
            >
              <SectionHeading
                id="guide-actions"
                icon={Settings2}
                title={t("guideActions")}
                help={t("guideActionsHelp")}
              />
              <ul className="de-action-grid">
                {guide.actions.map((action) => {
                  const Icon = icons[action.icon];
                  return (
                    <li
                      key={action.title}
                      className={
                        action.icon === "cancel" ? "de-action-danger" : ""
                      }
                    >
                      <Icon size={18} aria-hidden="true" />
                      <div>
                        <h3>{action.title}</h3>
                        <p>{action.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </details>
        </>
      )}

      {tab === "faq" && (
        <section className="de-guide-section" aria-labelledby="guide-faq">
          <SectionHeading
            id="guide-faq"
            icon={MessageCircleQuestion}
            title={t("faq")}
            help={t("faqHelp")}
          />
          <div className="de-faq-toolbar">
            <label className="de-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label={t("faqSearch")}
                placeholder={t("faqSearch")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="de-pills" role="group" aria-label={t("faq")}>
              {([["", t("faqAll")], ...categories] as const).map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value || "all"}
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
          {questions.length ? (
            <>
              <Accordion.Root type="multiple" className="de-faq">
                {visibleQuestions.map((item) => (
                  <Accordion.Item
                    value={item.q}
                    key={item.q}
                    className="de-faq-item"
                  >
                    <Accordion.Header asChild>
                      <h3>
                        <Accordion.Trigger className="de-faq-trigger">
                          <span>
                            <small>{guide.faqCategories[item.category]}</small>
                            {item.q}
                          </span>
                          <span className="de-faq-chevron" aria-hidden="true">
                            <ChevronDown size={16} />
                          </span>
                        </Accordion.Trigger>
                      </h3>
                    </Accordion.Header>
                    <Accordion.Content className="de-faq-content">
                      <p>{item.a}</p>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
              {!query.trim() && !category && questions.length > 5 && (
                <button
                  type="button"
                  className="de-faq-show-all"
                  onClick={() => setShowAllFaq((visible) => !visible)}
                >
                  {t(showAllFaq ? "faqShowLess" : "faqShowAll")}
                </button>
              )}
            </>
          ) : (
            <div className="de-faq-empty" role="status">
              <MessageCircleQuestion size={28} aria-hidden="true" />
              <p>{t("faqEmpty")}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
              >
                <X size={15} />
                {t("faqClear")}
              </Button>
            </div>
          )}
        </section>
      )}

      {tab === "start" && (
        <section className="de-guide-cta">
          <span className="de-guide-cta-icon" aria-hidden="true">
            <Rocket size={26} />
          </span>
          <div>
            <h2>{t("guideCtaTitle")}</h2>
            <p>{t("emptyHelp")}</p>
          </div>
          <Button onClick={create}>
            {t("guideCta")}
            <ArrowRight size={16} />
          </Button>
        </section>
      )}
    </div>
  );
}
