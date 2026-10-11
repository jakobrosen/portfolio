type SectionHeadingProps = { children: string };

function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <h3 className="animate-reveal text-sm font-bold tracking-widest text-foreground uppercase">
      {children}
    </h3>
  );
}

export default SectionHeading;
