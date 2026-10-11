import CardLink from "./CardLink";
import HoverCard from "./HoverCard";
import TechTags from "./TechTags";

type TimelineItemProps = {
  period: string;
  title: string;
  subtitle: string;
  description?: string;
  tech?: string[];
  url?: string;
};

function TimelineItem({
  period,
  title,
  subtitle,
  description,
  tech,
  url,
}: TimelineItemProps) {
  const heading = `${title} · ${subtitle}`;

  return (
    <HoverCard className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:gap-6">
      <p className="z-10 pt-0.5 text-xs font-semibold tracking-wide text-muted uppercase">
        {period}
      </p>
      <div className="z-10 flex flex-col gap-3">
        <h4 className="font-semibold">
          {url ? <CardLink href={url}>{heading}</CardLink> : heading}
        </h4>
        {description && (
          <p className="text-description text-muted">{description}</p>
        )}
        {tech && <TechTags tech={tech} />}
      </div>
    </HoverCard>
  );
}

export default TimelineItem;
