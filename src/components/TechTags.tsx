import ui from "../i18n/ui";
import useLanguage from "../i18n/useLanguage";

type TechTagsProps = { tech: string[] };

function TechTags({ tech }: TechTagsProps) {
  const { t } = useLanguage();

  return (
    <ul className="flex flex-wrap gap-2" aria-label={t(ui.technologiesUsed)}>
      {tech.map((item) => (
        <li
          key={item}
          className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default TechTags;
