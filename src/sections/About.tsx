import Section from "../components/Section";
import about from "../data/about";
import useLanguage from "../i18n/useLanguage";

function About() {
  const { language } = useLanguage();

  return (
    <Section id="about">
      {about[language].map((paragraph, index) => (
        <p key={index} className="animate-reveal text-muted">
          {paragraph}
        </p>
      ))}
    </Section>
  );
}

export default About;
