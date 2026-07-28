import type { Metadata } from "next"
import { LegalShell, LegalSection, LegalList } from "@/components/legal/legal-shell"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "How to reach the Vision Menu team — support email, hours, and response times.",
}

export default function ContactPage() {
  return (
    <LegalShell
      eyebrow="Support"
      title="Contact us"
      subtitle="Questions about your account, your subscription, or the platform itself — reach out and a real person will get back to you."
      updated="29 July 2026"
    >
      <LegalSection title="How to reach us">
        <p>
          Vision Menu is run by a small, focused team, and email is the fastest way to reach us
          — every message is read and answered by a person, not a bot.
        </p>
        <LegalList
          items={[
            <>
              <span className="font-semibold text-ink">Email — </span>
              <a
                href="mailto:support@visionmenu.app"
                className="font-semibold text-primary hover:underline"
              >
                support@visionmenu.app
              </a>{" "}
              for account, billing, technical, and general enquiries
            </>,
            <>
              <span className="font-semibold text-ink">Phone — </span>
              [Support phone — to be completed]
            </>,
            <>
              <span className="font-semibold text-ink">Registered address — </span>
              [Registered business address — to be completed]
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Support hours">
        <p>
          Our support team is available Monday to Saturday, 10:00 AM – 7:00 PM IST, excluding
          national holidays. Messages received outside these hours are queued and answered on
          the next working day.
        </p>
      </LegalSection>

      <LegalSection title="Typical response time">
        <p>
          We aim to respond to every enquiry within one business day, and most are answered far
          sooner than that. Issues that stop a restaurant from taking orders — a checkout outage
          or a kitchen-display problem, for example — are treated as priority and are usually
          addressed the same day.
        </p>
      </LegalSection>

      <LegalSection title="Questions about a specific order">
        <p>
          Vision Menu builds and operates the ordering platform, but every order is placed with,
          prepared by, and paid to the restaurant itself — we don't hold order funds or run a
          restaurant's kitchen. If you're a diner with a question about a specific order — a
          missing item, a delay, a refund — please contact the restaurant directly using the
          details on your receipt or order confirmation, or ask a staff member at the counter.
        </p>
        <p>
          If you're a restaurant owner and need help with your Vision Menu account, subscription,
          or the platform itself, email{" "}
          <a
            href="mailto:support@visionmenu.app"
            className="font-semibold text-primary hover:underline"
          >
            support@visionmenu.app
          </a>{" "}
          and we'll take it from there.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
