import type { Education } from "../types";

const education: Education[] = [
  {
    period: { en: "2025 - Present", sv: "2025 - Nu" },
    degree: { en: "Frontend Developer", sv: "Frontendutvecklare" },
    school: "EC Utbildning",
    description: {
      en: "Higher Vocational Education program. The focus is on frontend development, including HTML, CSS, JavaScript, TypeScript, React, and Angular, but the program also covers a substantial amount of backend development with Node.js, Express.js, databases, and .NET.",
      sv: "YH-utbildning med fokus på frontendutveckling, bland annat HTML, CSS, JavaScript, TypeScript, React och Angular. Utbildningen innehåller också en hel del backendutveckling med Node.js, Express.js, databaser och .NET.",
    },
    url: "https://ecutbildning.se/",
  },
  {
    period: "2024 - 2025",
    degree: "Komvux",
    school: "NTI-Skolan",
    description: {
      en: "Distance studies while working full time. Courses included Programming in C#, User Interface Design, and Mathematics.",
      sv: "Distansstudier vid sidan av heltidsarbete. Kurserna omfattade bland annat Programmering i C#, Gränssnittsdesign och Matematik.",
    },
    url: "https://nti.se/",
  },
  {
    period: "2011 - 2014",
    degree: { en: "Upper Secondary", sv: "Gymnasieutbildning" },
    school: "Grillska Gymnasiet",
    description: {
      en: "University-preparatory upper secondary program with a focus on mathematics and physics. My chosen specialization was programming and web design, where I learned the fundamentals of programming with Visual Basic, as well as basic HTML and CSS.",
      sv: "Högskoleförberedande gymnasieprogram med fokus på matematik och fysik. Min valda inriktning var programmering och webbdesign, där jag lärde mig grunderna i programmering med Visual Basic samt grundläggande HTML och CSS.",
    },
    url: "https://grillska.se/",
  },
];

export default education;
