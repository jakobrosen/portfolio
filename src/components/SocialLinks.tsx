import { FaGithub, FaLinkedin } from "react-icons/fa";

const links = [
  { label: "GitHub", href: "https://github.com/jakobrosen", Icon: FaGithub },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jakobrosen",
    Icon: FaLinkedin,
  },
];

function SocialLinks() {
  return (
    <ul className="flex gap-3">
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}>
            <Icon className="size-7 text-muted transition-colors hover:text-accent" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default SocialLinks;
