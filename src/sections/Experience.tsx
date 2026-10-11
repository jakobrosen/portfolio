import Section from "../components/Section";
import TimelineItem from "../components/TimelineItem";
import experience from "../data/experience";
import useLanguage from "../i18n/useLanguage";

function Experience() {
  const { t } = useLanguage();

  return (
    <Section id="experience">
      <ol className="group/list flex flex-col gap-12">
        {experience.map((item, index) => (
          <li key={index} className="animate-reveal">
            <TimelineItem
              period={t(item.period)}
              title={t(item.role)}
              subtitle={t(item.company)}
              description={t(item.description)}
              tech={item.tech}
              url={item.url}
            />
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default Experience;
