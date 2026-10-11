import Section from "../components/Section";
import contact from "../data/contact";
import ui from "../i18n/ui";
import useLanguage from "../i18n/useLanguage";

function Contact() {
  const { t } = useLanguage();
  const mailto = `mailto:${contact.email}`;

  return (
    <Section id="contact">
      <p className="animate-reveal text-muted">{t(contact.text)}</p>
      <div className="mt-2 flex animate-reveal flex-wrap items-center gap-x-6 gap-y-3">
        <a
          href={mailto}
          className="rounded-md border border-accent px-5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent-subtle focus-visible:bg-accent-subtle">
          {t(ui.sendEmail)}
        </a>
        <a
          href={mailto}
          className="text-sm text-muted transition-colors hover:text-foreground focus-visible:text-foreground">
          {contact.email}
        </a>
      </div>
    </Section>
  );
}

export default Contact;
