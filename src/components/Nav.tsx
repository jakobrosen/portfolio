import useActiveSection from "../hooks/useActiveSection";
import ui from "../i18n/ui";
import useLanguage from "../i18n/useLanguage";
import type { SectionId } from "./Section";

const sections = [
  "about",
  "projects",
  "education",
  "experience",
  "contact",
] as const satisfies readonly SectionId[];

function Nav() {
  const active = useActiveSection(sections);
  const { t } = useLanguage();

  return (
    <nav className="hidden lg:block">
      <ul className="flex flex-col items-end gap-10">
        {sections.map((section) => (
          <NavLink
            key={section}
            id={section}
            label={t(ui.sections[section])}
            active={section === active}
          />
        ))}
      </ul>
    </nav>
  );
}

type NavLinkProps = { id: string; label: string; active: boolean };

function NavLink({ id, label, active }: NavLinkProps) {
  return (
    <li className="w-[85%] animate-reveal">
      <a
        href={`#${id}`}
        aria-current={active ? "true" : undefined}
        className="group flex w-full items-center justify-end text-muted uppercase transition-colors hover:text-accent focus-visible:text-accent aria-current:text-accent">
        <span>{label}</span>
        <span className="h-0.5 w-0 bg-accent transition-all duration-250 group-hover:ml-2 group-hover:w-5 group-focus-visible:ml-2 group-focus-visible:w-5 group-aria-current:ml-2 group-aria-current:w-5 motion-reduce:transition-none"></span>
      </a>
    </li>
  );
}

export default Nav;
