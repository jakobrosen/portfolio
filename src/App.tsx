import Header from "./sections/Header";
import About from "./sections/About";
import Projects from "./sections/Projects";
import Education from "./sections/Education";
import Experience from "./sections/Experience";
import Contact from "./sections/Contact";
import useStaggeredReveal from "./hooks/useStaggeredReveal";

function App() {
  useStaggeredReveal();

  return (
    <div className="lg:flex lg:h-full">
      <Header />
      <main className="px-6 py-16 lg:w-3/5 lg:py-22 lg:pr-8 lg:pl-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-24 lg:mx-0 lg:max-w-xl">
          <About />
          <Projects />
          <Education />
          <Experience />
          <Contact />
        </div>
      </main>
    </div>
  );
}

export default App;
