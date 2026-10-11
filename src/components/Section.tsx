import type { ReactNode } from "react";
import ui from "../i18n/ui";
import useLanguage from "../i18n/useLanguage";
import SectionHeading from "./SectionHeading";

export type SectionId = keyof typeof ui.sections;

type SectionProps = { id: SectionId; children: ReactNode };

function Section({ id, children }: SectionProps) {
  const { t } = useLanguage();

  return (
    <section id={id} className="flex scroll-mt-12 flex-col gap-4">
      <SectionHeading>{t(ui.sections[id])}</SectionHeading>
      {children}
    </section>
  );
}

export default Section;
