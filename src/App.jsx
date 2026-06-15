import {useEffect, useState} from "react";

const researchAreas = [
  {
    number: "01",
    title: "CO₂ reduction on copper",
    description:
      "Understanding how copper surface structure and the electrode-electrolyte environment shape reaction pathways and product selectivity.",
    tags: ["Electrocatalysis", "Surface science"]
  },
  {
    number: "02",
    title: "Machine-learned interatomic potentials",
    description:
      "Building accurate atomistic models that extend first-principles fidelity to larger systems and longer simulation times.",
    tags: ["Active learning", "Molecular dynamics"]
  },
  {
    number: "03",
    title: "Atomistic materials modeling",
    description:
      "Studying adsorption, reconstruction, solvation, and defects to connect microscopic surface chemistry with materials performance.",
    tags: ["DFT", "Interfaces", "Thermodynamics"]
  }
];

const methods = [
  {name: "Density functional theory", level: 92},
  {name: "Atomistic simulation", level: 86},
  {name: "Machine learning potentials", level: 80}
];

function useDarkMode() {
  const getInitialTheme = () => {
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  };

  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return [isDark, setIsDark];
}

function AtomVisual() {
  return (
    <div
      className="atom-visual"
      aria-label="Abstract atomistic interface illustration"
    >
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <div className="orbital orbital-three" />
      <span className="atom atom-center" />
      <span className="atom atom-one" />
      <span className="atom atom-two" />
      <span className="atom atom-three" />
      <div className="surface-grid" />
    </div>
  );
}

function App() {
  const [isDark, setIsDark] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" onClick={closeMenu}>
          <span>&lt;</span> Seungchang Han <span>/&gt;</span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
        </button>
        <nav className={menuOpen ? "site-nav open" : "site-nav"}>
          <a href="#research" onClick={closeMenu}>
            Research
          </a>
          <a href="#methods" onClick={closeMenu}>
            Methods
          </a>
          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            onClick={() => setIsDark(dark => !dark)}
          >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-copy">
            <p className="eyebrow">Ph.D. Student · Materials Science</p>
            <h1>
              Computational insight into catalytic <em>interfaces.</em>
            </h1>
            <p className="hero-intro">
              I study electrochemical CO₂ reduction on copper using
              first-principles calculations and machine-learned interatomic
              potentials.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#research">
                View research <span aria-hidden="true">↓</span>
              </a>
              <a
                className="button secondary"
                href="https://github.com/seungchanghan"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <AtomVisual />
        </section>

        <section id="research" className="research section-shell">
          <div className="section-heading">
            <p className="eyebrow">Research</p>
            <h2>What I work on</h2>
            <p>
              Connecting electronic-structure calculations with atomistic
              machine learning to study catalytic environments at realistic
              scales.
            </p>
          </div>
          <div className="research-grid">
            {researchAreas.map(area => (
              <article className="research-card" key={area.number}>
                <span className="card-number">{area.number}</span>
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                <ul>
                  {area.tags.map(tag => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="methods" className="methods">
          <div className="section-shell methods-inner">
            <div>
              <p className="eyebrow">Methods</p>
              <h2>Computational toolkit</h2>
              <p className="methods-intro">
                From electronic structure to dynamic interfaces, I use
                complementary methods to bridge accuracy and scale.
              </p>
            </div>
            <div className="method-list">
              {methods.map(method => (
                <div className="method" key={method.name}>
                  <div>
                    <span>{method.name}</span>
                    <span>{method.level}%</span>
                  </div>
                  <div className="meter">
                    <span style={{width: `${method.level}%`}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact section-shell">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Let&apos;s talk research.</h2>
          </div>
          <div className="contact-copy">
            <p>
              Open to conversations about computational catalysis, machine
              learning potentials, and atomistic materials modeling.
            </p>
            <a
              className="contact-link"
              href="https://github.com/seungchanghan"
              target="_blank"
              rel="noreferrer"
            >
              Connect on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer>
        <span>© {new Date().getFullYear()} Seungchang Han</span>
        <span>
          Based on{" "}
          <a
            href="https://github.com/saadpasta/developerFolio"
            target="_blank"
            rel="noreferrer"
          >
            developerFolio
          </a>
        </span>
      </footer>
    </>
  );
}

export default App;
