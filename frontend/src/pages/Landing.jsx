import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const features = [
  { icon: '🔍', title: 'Intelligent Resume Screening', desc: 'AI-powered analysis matches resumes against job requirements, evaluating skills, experience, qualifications, and mandatory criteria automatically.', color: 'rgba(59, 130, 246, 0.15)' },
  { icon: '🛡️', title: 'AI Content Detection', desc: 'Confidence-based detection of AI-generated or fabricated resume content. Risk indicators, not absolute claims — transparency first.', color: 'rgba(139, 92, 246, 0.15)' },
  { icon: '✅', title: 'Mandatory Requirement Validation', desc: 'Automatically validates candidates against must-have criteria. Only qualified applicants reach your dashboard.', color: 'rgba(34, 197, 94, 0.15)' },
  { icon: '📊', title: 'Explainable Match Scores', desc: 'Transparent scoring broken down into skills, experience, qualifications, and relevance. Every decision comes with a clear explanation.', color: 'rgba(245, 158, 11, 0.15)' },
  { icon: '💬', title: 'Screening Question Analysis', desc: 'Evaluate candidate responses for relevance and authenticity. Detect off-topic, generic, or potentially AI-generated answers.', color: 'rgba(6, 182, 212, 0.15)' },
  { icon: '⚡', title: 'Real-time Pipeline', desc: 'From application to screening to decision — track every candidate through a clear, auditable pipeline with full status history.', color: 'rgba(251, 113, 133, 0.15)' },
];

const steps = [
  { num: '1', title: 'Create Your Profile', desc: 'Sign up as a Hiring Team member or Job Applicant. Set up your professional profile and organization.' },
  { num: '2', title: 'Post or Browse Jobs', desc: 'Hiring teams publish jobs with detailed requirements. Applicants browse the marketplace and apply.' },
  { num: '3', title: 'AI-Powered Screening', desc: 'Resumes are automatically analyzed against job criteria. Mandatory requirements validated instantly.' },
  { num: '4', title: 'Review & Decide', desc: 'View match scores, screening results, and explanations. Shortlist the best candidates confidently.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-content animate-in">
          <div className="hero-badge">🚀 AI-Powered Recruitment Platform</div>
          <h1 className="hero-title">
            Hire Smarter.<br />
            Screen Faster.<br />
            <span className="gradient-text">Build Better Teams.</span>
          </h1>
          <p className="hero-subtitle">
            Reduce manual screening by 80%. Let AI validate requirements, detect suspicious content,
            and surface the most relevant candidates — while keeping humans in the loop.
          </p>
          <div className="hero-ctas">
            <button className="hero-cta-btn hero-cta-primary" onClick={() => navigate('/register?role=hiring')}>
              🏢 I'm Hiring
            </button>
            <button className="hero-cta-btn hero-cta-secondary" onClick={() => navigate('/register?role=applicant')}>
              💼 I'm Looking for a Job
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">
          Everything you need to transform your recruitment process with intelligent automation.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Get started in minutes with a simple, intuitive workflow.</p>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div key={i} className="step-card animate-in" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="step-number">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 className="section-title">Ready to Transform Your Hiring?</h2>
        <p className="section-subtitle">
          Join thousands of companies using HireShield to find the right candidates faster.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            Get Started Free
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/jobs/marketplace')}>
            Browse Jobs
          </button>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 HireShield — AI-Powered Smart Recruitment Platform</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
          Built with ❤️ for smarter, fairer, and more efficient hiring.
        </p>
      </footer>
    </div>
  );
}
