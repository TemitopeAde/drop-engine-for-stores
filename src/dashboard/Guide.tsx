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
import { guide, type FaqCategory } from "../locales/guide.en";
import { t } from "../locales/en";

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
const sections = [
  ["guide-steps", "guideSteps"],
  ["guide-lifecycle", "guideStatuses"],
  ["guide-actions", "guideActions"],
  ["guide-faq", "faq"],
] as const;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Checkout({ state }: { state: keyof typeof checkoutIcons }) {
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "">("");
  const questions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return guide.faq.filter(
      (item) =>
        (!category || item.category === category) &&
        (!needle ||
          item.q.toLowerCase().includes(needle) ||
          item.a.toLowerCase().includes(needle)),
    );
  }, [query, category]);
  const categories = Object.entries(guide.faqCategories) as [
    FaqCategory,
    string,
  ][];

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
            <Button variant="outline" onClick={() => scrollTo("guide-faq")}>
              <MessageCircleQuestion size={17} />
              {t("faq")}
            </Button>
          </div>
        </div>
        <div className="de-hero-visual" aria-hidden="true">
          {guide.lifecycle.map((stage, index) => (
            <div className="de-hero-stage" key={stage.status}>
              <span
                className={`de-badge de-badge-${stage.status.toLowerCase()}`}
              >
                {t(stage.status)}
              </span>
              <Checkout state={stage.checkout} />
              {index < guide.lifecycle.length - 1 && (
                <ArrowRight className="de-hero-arrow" size={14} />
              )}
            </div>
          ))}
        </div>
      </section>

      <nav className="de-guide-jump" aria-label={t("guideJump")}>
        <span>{t("guideJump")}</span>
        {sections.map(([id, label]) => (
          <button type="button" key={id} onClick={() => scrollTo(id)}>
            {t(label)}
          </button>
        ))}
      </nav>

      <section className="de-guide-section" aria-labelledby="guide-steps">
        <SectionHeading
          id="guide-steps"
          icon={Rocket}
          title={t("guideSteps")}
          help={t("guideStepsHelp")}
        />
        <ol className="de-steps">
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
                <p>{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="de-guide-section" aria-labelledby="guide-lifecycle">
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

      <section className="de-guide-section" aria-labelledby="guide-actions">
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
                className={action.icon === "cancel" ? "de-action-danger" : ""}
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
          <Accordion.Root type="multiple" className="de-faq">
            {questions.map((item) => (
              <Accordion.Item value={item.q} key={item.q} className="de-faq-item">
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
    </div>
  );
}
