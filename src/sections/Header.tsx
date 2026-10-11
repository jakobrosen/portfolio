import LanguageSwitcher from "../components/LanguageSwitcher";
import Nav from "../components/Nav";
import SocialLinks from "../components/SocialLinks";
import profile from "../data/profile";
import useLanguage from "../i18n/useLanguage";

function Header() {
  const { t } = useLanguage();

  return (
    <header className="px-6 pt-16 lg:sticky lg:top-0 lg:h-screen lg:w-2/5 lg:bg-surface lg:py-22 lg:pr-16 lg:pl-8">
      <div className="mx-auto flex max-w-3xl flex-col lg:mr-0 lg:ml-auto lg:h-full lg:w-full lg:max-w-56">
        <div className="lg:flex lg:flex-1 lg:flex-col lg:items-end">
          <div className="lg:w-max">
            <h1 className="animate-reveal text-4xl font-bold whitespace-nowrap lg:text-5xl">
              <a href="/">{profile.name}</a>
            </h1>
            <h2 className="mt-3 animate-reveal text-base text-muted">
              {t(profile.title)}
            </h2>
          </div>
        </div>
        <Nav />
        <div className="lg:flex lg:flex-1 lg:items-end">
          <div className="mt-8 flex w-full animate-reveal items-center gap-6 lg:justify-between">
            <LanguageSwitcher />
            <SocialLinks />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
