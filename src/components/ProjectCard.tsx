import useLanguage from "../i18n/useLanguage";
import type { Project } from "../types";
import CardLink from "./CardLink";
import HoverCard from "./HoverCard";
import TechTags from "./TechTags";

type ProjectCardProps = { project: Project };

function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLanguage();
  const { tech, url, image } = project;
  const title = t(project.title);
  const description = t(project.description);

  return (
    <HoverCard className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
      {image && (
        <img
          src={image}
          alt=""
          width={400}
          height={250}
          loading="lazy"
          className="z-10 order-2 aspect-8/5 w-full max-w-52 rounded border-2 border-foreground/10 object-cover transition group-hover:border-foreground/30 sm:order-1 sm:mt-1 sm:max-w-28 lg:max-w-none"
        />
      )}

      <div className="z-10 order-1 flex flex-col gap-3 sm:order-2 sm:col-start-2">
        <h4 className="font-semibold">
          {url ? <CardLink href={url}>{title}</CardLink> : title}
        </h4>
        <p className="text-description text-muted">{description}</p>
        <TechTags tech={tech} />
      </div>
    </HoverCard>
  );
}

export default ProjectCard;
