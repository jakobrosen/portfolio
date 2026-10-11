export type Language = "en" | "sv";

export type Localized<T> = Record<Language, T>;

export type Translatable = string | Localized<string>;

export type Contact = {
  text: Translatable;
  email: string;
};

export type Profile = {
  name: string;
  title: Translatable;
};

export type Project = {
  title: Translatable;
  description: Translatable;
  tech: string[];
  url?: string;
  image?: string;
};

export type Education = {
  period: Translatable;
  degree: Translatable;
  school: Translatable;
  description?: Translatable;
  url?: string;
};

export type Experience = {
  period: Translatable;
  role: Translatable;
  company: Translatable;
  description: Translatable;
  tech?: string[];
  url?: string;
};
