import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import RevealOnScroll from "../components/RevealOnScroll";
import { getPlatformStats } from "../api/platformApi";
import "./LandingPage.css";

const FEATURES = [
  {
    title: "Problem Catalog",
    desc: "Hundreds of hand-picked problems across difficulty levels and topics, with real hidden test cases and instant grading.",
    icon: "🧩",
  },
  {
    title: "Structured Courses",
    desc: "Guided learning tracks that bundle problems into a syllabus, with live progress tracking as you solve.",
    icon: "📚",
  },
  {
    title: "Timed Contests",
    desc: "Register, start your own countdown, and compete on a fixed problem set with a real scored leaderboard.",
    icon: "🏆",
  },
  {
    title: "Instant Playground",
    desc: "A free-form code runner for 5 languages — no problem required, just write and run.",
    icon: "⚡",
  },
  {
    title: "Global Leaderboard",
    desc: "See where you rank by problems solved, with medals for the top performers.",
    icon: "📈",
  },
  {
    title: "Discussions",
    desc: "Read and share approaches per problem, upvote the best explanavtions, and learn from how others solved it.",
    icon: "💬",
  },
];

const STEPS = [
  { step: "1", title: "Create your account", desc: "Sign up free and set your preferred language." },
  { step: "2", title: "Pick a problem or course", desc: "Browse by difficulty, tag, or follow a structured track." },
  { step: "3", title: "Write, run, submit", desc: "Code in a real editor, test instantly, get graded against hidden cases." },
  { step: "4", title: "Track your growth", desc: "Watch your streak, rank, and solved count build over time." },
];

const FAQS = [
  {
    q: "Is ExtraTech Solution free to use?",
    a: "Yes. Most of the problem catalog, Playground, Leaderboard, and Discussions are free for every account. Premium unlocks an additional set of advanced problems and courses.",
  },
  {
    q: "Which languages are supported?",
    a: "Java, Python, JavaScript, C, and C++ — for Run, Submit, and the standalone Playground.",
  },
  {
    q: "How does grading work?",
    a: "Your code runs against hidden test cases on our servers. You get a pass/fail breakdown per test case, a real compiled runtime, and — for Accepted solutions — how you compare to other submissions in the same language.",
  },
  {
    q: "Can I take part in contests?",
    a: "Yes. Register any time before a contest ends, then start your own personal timed window whenever you're ready — your countdown and the contest's overall window both apply.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. Creating an account and solving free problems requires no payment information at all.",
  },
];

function StatCard({ value, label, isLoading }) {
  return (
    <div className="landing-stat-card">
      <span className="landing-stat-number">{isLoading ? "—" : value.toLocaleString()}</span>
      <span className="landing-stat-label">{label}</span>
    </div>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getPlatformStats();
        setStats(response.data);
      } catch (err) {
        setStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) scale(1.02)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />

        <div className="landing-hero-text">
          <span className="landing-badge">Sharpen your dev instincts</span>

          <h1>
            Build sharper code.
            <br />
            <span className="landing-highlight">Ship your future.</span>
          </h1>

          <p className="landing-subtext">
            ExtraTech Solution turns focused practice into confident
            problem-solving — real hidden-test-case grading, structured
            courses, live contests, and a workspace built the way real
            developers think.
          </p>

          <div className="landing-cta-group">
            <Link to="/auth" className="btn btn-primary">
              Get started free
            </Link>
            <Link to="/problems" className="btn btn-secondary">
              Explore problems
            </Link>
          </div>

          <p className="landing-trust-line">
            No credit card required · Free problems available instantly
          </p>
        </div>

        <div className="landing-code-preview">
          <div
            className="code-window"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="code-window-dots">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
            </div>
            <pre className="code-window-body">
{`function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      <RevealOnScroll>
        <div className="landing-stats-band">
          <StatCard value={stats?.totalStudents ?? 0} label="Students Learning" isLoading={isLoadingStats} />
          <StatCard value={stats?.totalProblems ?? 0} label="Problems to Solve" isLoading={isLoadingStats} />
          <StatCard value={stats?.totalCourses ?? 0} label="Structured Courses" isLoading={isLoadingStats} />
          <StatCard value={stats?.totalContests ?? 0} label="Contests Run" isLoading={isLoadingStats} />
        </div>
      </RevealOnScroll>

      <div className="landing-section">
        <RevealOnScroll>
          <h2 className="landing-section-title">Everything you need to get better at coding</h2>
          <p className="landing-section-subtitle">
            One platform, six ways to practice — pick what fits how you learn.
          </p>
        </RevealOnScroll>

        <div className="landing-features-grid">
          {FEATURES.map((f, idx) => (
            <RevealOnScroll key={f.title} delay={idx * 80}>
              <div className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <div className="landing-section landing-steps-section">
        <RevealOnScroll>
          <h2 className="landing-section-title">How it works</h2>
        </RevealOnScroll>

        <div className="landing-steps-grid">
          {STEPS.map((s, idx) => (
            <RevealOnScroll key={s.step} delay={idx * 100}>
              <div className="landing-step-card">
                <div className="landing-step-number">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <div className="landing-section">
        <RevealOnScroll>
          <h2 className="landing-section-title">Frequently asked questions</h2>
        </RevealOnScroll>

        <div className="landing-faq-list">
          {FAQS.map((faq, idx) => (
            <RevealOnScroll key={faq.q} delay={idx * 50}>
              <div className="landing-faq-item">
                <button
                  type="button"
                  className="landing-faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.q}
                  <span className="landing-faq-toggle">{openFaq === idx ? "−" : "+"}</span>
                </button>
                {openFaq === idx && <p className="landing-faq-answer">{faq.a}</p>}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>

      <RevealOnScroll>
        <div className="landing-cta-footer">
          <Logo size={40} />
          <h2>Ready to sharpen your skills?</h2>
          <p>Join ExtraTech Solution and start solving today — it's free to begin.</p>
          <Link to="/auth" className="btn btn-primary landing-cta-footer-btn">
            Create your free account
          </Link>
        </div>
      </RevealOnScroll>

      <Footer />
    </div>
  );
}