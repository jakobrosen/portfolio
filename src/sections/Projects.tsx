import ProjectCard from "../components/ProjectCard";
import Section from "../components/Section";
import projects from "../data/projects";

function Projects() {
  return (
    <Section id="projects">
      <ul className="group/list flex flex-col gap-12">
        {projects.map((project, index) => (
          <li key={index} className="animate-reveal">
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default Projects;
