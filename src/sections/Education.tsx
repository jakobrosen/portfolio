import Section from "../components/Section";
import TimelineItem from "../components/TimelineItem";
import education from "../data/education";
import useLanguage from "../i18n/useLanguage";

function Education() {
  const { t } = useLanguage();

  return (
    <Section id="education">
      <ol className="group/list flex flex-col gap-12">
        {education.map((item, index) => (
          <li key={index} className="animate-reveal">
            <TimelineItem
              period={t(item.period)}
              title={t(item.degree)}
              subtitle={t(item.school)}
              description={item.description && t(item.description)}
              url={item.url}
            />
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default Education;
