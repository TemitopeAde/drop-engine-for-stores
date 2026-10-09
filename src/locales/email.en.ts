// Waitlist confirmation email. Kept apart from the dashboard catalog because it
// is rendered on the server, like the consent text it confirms.
export const emailEn = {
  subject: "You're on the waitlist for {drop}",
  heading: "You're on the list",
  intro: "Thanks for joining the waitlist for {drop}.",
  opens: "It opens on {date}.",
  cta: "View {product}",
  fallback: "Or copy this link into your browser:",
  footer:
    "You're receiving this because you joined a waitlist on {site}. You can leave the waitlist from the product page at any time.",
  broadcastFooter:
    "You're receiving this because you joined the waitlist for {drop} on {site}. You can leave the waitlist from the product page at any time.",
  site: "our store",
};
export type EmailKey = keyof typeof emailEn;
