import angularApparelImage from "../assets/projects/angular-apparel.webp";
import countryExplorerImage from "../assets/projects/country-explorer.webp";
import portfolioImage from "../assets/projects/portfolio.webp";
import type { Project } from "../types";

const projects: Project[] = [
  {
    title: "Portfolio",
    description: {
      en: "This site. A responsive, bilingual developer portfolio with a sticky sidebar, scroll-aware navigation and subtle animations.",
      sv: "Den här sidan. En responsiv utvecklarportfolio med fast sidopanel, navigering som följer scrollningen och diskreta animationer.",
    },
    tech: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    url: "https://github.com/jakobrosen/portfolio",
    image: portfolioImage,
  },
  {
    title: "Angular Apparel",
    description: {
      en: "A full-stack clothing web shop built with Angular and an Express REST API, featuring URL-synced product filtering, a persistent cart and a JWT-protected admin panel.",
      sv: "En fullstack-webbutik för kläder byggd med Angular och ett REST-API i Express, med produktfiltrering, varukorg och en JWT-skyddad adminpanel.",
    },
    tech: [
      "Angular",
      "TypeScript",
      "Tailwind CSS",
      "Express.js",
      "SQLite",
      "Sequelize",
      "REST-API",
      "Zod",
      "JWT",
    ],
    url: "https://github.com/jakobrosen/angular-apparel",
    image: angularApparelImage,
  },
  {
    title: "Country Explorer",
    description: {
      en: "A single-page application built with React for exploring country data, checking local weather and playing a flag quiz. Developed in a team of five using Scrum.",
      sv: "En single page-applikation byggd med React för att utforska data om länder, kolla lokalt väder och spela ett flaggquiz. Utvecklad i ett team på fem personer med Scrum.",
    },
    tech: ["React", "JavaScript", "React Router", "Scrum"],
    url: "https://github.com/jakobrosen/country-explorer",
    image: countryExplorerImage,
  },
];

export default projects;
