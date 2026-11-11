// "use client";

// import Link from "next/link";
// import { Activity, ArrowRight, Check, Cpu, Gauge, Layers3, LockKeyhole, Monitor, Radio, ShieldCheck, Terminal, Zap } from "lucide-react";
// import { useIsUserLoggedIn } from "~/hooks/api/auth";

// export default function LandingPage() {
//   const { isUserLoggedIn, isLoading } = useIsUserLoggedIn();
//   const destination = isUserLoggedIn ? "/dashboard" : "/login";

//   return (
//     <main className="landing">
//       <nav className="landing-nav shell">
//         <Link href="/" className="brand-lockup"><span className="brand-symbol"><Activity size={20}/></span><span>linux<span className="brand-accent">fleet</span></span></Link>
//         <div className="landing-nav-links"><a href="#features">Platform</a><a href="#workflow">How it works</a><a href="#monitoring">Monitoring</a></div>
//         <div className="landing-nav-actions"><Link className="button button-quiet" href={destination}>Log in</Link><Link className="button button-primary" href={destination}>{isLoading ? "Loading..." : "Get started"} <ArrowRight size={16}/></Link></div>
//       </nav>

//       <section className="hero shell">
//         <div className="hero-copy">
//           <div className="eyebrow"><span className="pulse-dot"/> LINUX INFRASTRUCTURE, IN ONE PLACE</div>
//           <h1>Every Linux node.<br/><span className="gradient-text">One clear picture.</span></h1>
//           <p className="hero-description">A focused command centre for your Linux machines. Track node health, understand resource usage and explore live metrics without jumping between terminals.</p>
//           <div className="hero-actions"><Link href={destination} className="button button-primary button-large">Explore your fleet <ArrowRight size={17}/></Link><a href="#features" className="button button-secondary button-large">Explore platform</a></div>
//           <div className="hero-proof"><span><Check size={14}/> Real machine metrics</span><span><Check size={14}/> Prometheus powered</span><span><Check size={14}/> Grafana dashboards</span></div>
//         </div>
//         <div className="hero-visual">
//           <div className="visual-glow"/>
//           <div className="terminal-window">
//             <div className="terminal-top"><div className="window-dots"><i/><i/><i/></div><span>fleet-control / overview</span><span className="terminal-live"><b/> LIVE</span></div>
//             <div className="terminal-body">
//               <div className="terminal-kicker">YOUR INFRASTRUCTURE</div>
//               <div className="terminal-title">Fleet health <span className="health-good"><i/> Operational</span></div>
//               <div className="terminal-stats"><div><span>CONNECTED NODES</span><strong>—</strong><small>Connect your first node</small></div><div><span>METRIC STREAM</span><strong>15s</strong><small>Agent reporting interval</small></div></div>
//               <div className="terminal-chart"><div className="chart-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="Decorative monitoring waveform"><path d="M0 80 C30 75 40 43 65 55 S95 86 120 60 S160 25 185 49 S220 75 245 52 S280 28 305 48 S340 84 365 56 S405 35 430 49 S470 61 500 20" fill="none" stroke="#48a5ff" strokeWidth="2.5"/><path d="M0 80 C30 75 40 43 65 55 S95 86 120 60 S160 25 185 49 S220 75 245 52 S280 28 305 48 S340 84 365 56 S405 35 430 49 S470 61 500 20 L500 110 L0 110Z" fill="url(#heroFill)" opacity=".35"/><defs><linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#168cff"/><stop offset="1" stopColor="#168cff" stopOpacity="0"/></linearGradient></defs></svg></div>
//               <div className="terminal-foot"><span><i className="legend-blue"/> CPU utilization</span><span><i className="legend-green"/> Memory utilization</span><span>LIVE DATA AFTER CONNECTION</span></div>
//             </div>
//           </div>
//           <div className="floating-chip chip-one"><span className="chip-icon"><Radio size={15}/></span><span><b>Agent reporting</b><small>Every 15 seconds</small></span><i className="pulse-dot"/></div>
//           <div className="floating-chip chip-two"><span className="chip-icon green-chip"><ShieldCheck size={15}/></span><span><b>Secure registration</b><small>Token-based onboarding</small></span></div>
//         </div>
//       </section>

//       <section className="trust-strip shell"><span>BUILT AROUND YOUR LINUX STACK</span><div><b><Terminal size={17}/> Linux</b><b><Activity size={17}/> Prometheus</b><b><Gauge size={17}/> Grafana</b><b><Layers3 size={17}/> tRPC</b></div></section>

//       <section id="features" className="section shell">
//         <div className="section-heading"><div className="eyebrow">ONE FLEET. LESS GUESSWORK.</div><h2>Know what is happening<br/>across your machines.</h2><p>From the first agent installation to deep metric exploration, keep the essentials close.</p></div>
//         <div className="feature-grid">
//           <article className="feature-card"><span className="feature-icon"><Monitor/></span><h3>Node visibility</h3><p>See registered machines, operating systems, connectivity and the latest report from each node.</p><span className="feature-meta">01 / FLEET INVENTORY</span></article>
//           <article className="feature-card"><span className="feature-icon feature-green"><Cpu/></span><h3>Resource health</h3><p>Understand CPU, memory, disk and battery information from the reports your agents send.</p><span className="feature-meta">02 / RESOURCE METRICS</span></article>
//           <article className="feature-card"><span className="feature-icon feature-purple"><Activity/></span><h3>Deep observability</h3><p>Use Prometheus as the metrics source and Grafana for rich dashboards and investigation.</p><span className="feature-meta">03 / OBSERVABILITY</span></article>
//         </div>
//       </section>

//       <section id="workflow" className="workflow-section"><div className="shell workflow-inner"><div><div className="eyebrow">GET CONNECTED IN MINUTES</div><h2>From zero nodes<br/>to fleet visibility.</h2><p>Generate a registration token, install the agent on your Linux machine and watch it appear in your workspace.</p><Link href={destination} className="button button-primary">Start onboarding <ArrowRight size={16}/></Link></div><div className="steps"><div className="step"><span>01</span><div><b>Create a node token</b><p>Generate a one-time registration token from your dashboard.</p></div><LockKeyhole/></div><div className="step"><span>02</span><div><b>Install the Linux agent</b><p>Run the installation command on the machine you want to monitor.</p></div><Terminal/></div><div className="step"><span>03</span><div><b>Monitor your fleet</b><p>Review node reports and open live Grafana dashboards.</p></div><Activity/></div></div></div></section>

//       <section id="monitoring" className="bottom-cta shell"><div><div className="eyebrow">YOUR INFRASTRUCTURE, UNDERSTOOD</div><h2>Bring your fleet into focus.</h2><p>Start with one machine. Grow into a complete Linux fleet.</p></div><Link href={destination} className="button button-primary button-large">Get started <ArrowRight size={17}/></Link></section>
//       <footer className="landing-footer shell"><Link href="/" className="brand-lockup"><span className="brand-symbol"><Activity size={17}/></span><span>linux<span className="brand-accent">fleet</span></span></Link><span>Infrastructure visibility for Linux teams.</span><span>© {new Date().getFullYear()} Linux Fleet</span></footer>
//     </main>
//   );
// }


"use client";

import Link from "next/link";
import { Activity, ArrowRight, Bell, Check, Cpu, Gauge, Layers3, LockKeyhole, Monitor, Radio, ServerOff, ShieldCheck, Terminal, Users, Zap } from "lucide-react";
import { useIsUserLoggedIn } from "~/hooks/api/auth";

const AGENT_REPO = "https://github.com/pratik44-god/fleet-agent";

export default function LandingPage() {
  const { isUserLoggedIn } = useIsUserLoggedIn();
  const destination = isUserLoggedIn ? "/dashboard" : "/login";
  // Always show a real label (no "Loading..." state); logged-in users go straight to the dashboard.
  const ctaLabel = isUserLoggedIn ? "Open dashboard" : "Get started";

  return (
    <main className="landing">
      <nav className="landing-nav shell">
        <Link href="/" className="brand-lockup"><span className="brand-symbol"><Activity size={20}/></span><span>linux<span className="brand-accent">fleet</span></span></Link>
        <div className="landing-nav-links"><a href="#features">Platform</a><a href="#workflow">How it works</a><a href="#monitoring">Monitoring</a></div>
        <div className="landing-nav-actions"><Link className="button button-quiet" href={destination}>Log in</Link><Link className="button button-primary" href={destination}>{ctaLabel} <ArrowRight size={16}/></Link></div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot"/> LINUX INFRASTRUCTURE, IN ONE PLACE</div>
          <h1>Every Linux node.<br/><span className="gradient-text">One clear picture.</span></h1>
          <p className="hero-description">The easiest way to onboard Linux nodes. Register a machine with a single token, then track node health, understand resource usage and explore live metrics without jumping between terminals.</p>
          <div className="hero-actions"><Link href={destination} className="button button-primary button-large">Explore your fleet <ArrowRight size={17}/></Link><a href="#features" className="button button-secondary button-large">Explore platform</a></div>
          <div className="hero-proof"><span><Check size={14}/> Connect a node in ~10 minutes</span><span><Check size={14}/> Prometheus powered</span><span><Check size={14}/> Grafana dashboards</span><span><Check size={14}/> CPU, RAM &amp; offline alerts</span></div>
        </div>
        <div className="hero-visual">
          <div className="visual-glow"/>
          <div className="terminal-window">
            <div className="terminal-top"><div className="window-dots"><i/><i/><i/></div><span>fleet-control / overview</span><span className="terminal-live"><b/> LIVE</span></div>
            <div className="terminal-body">
              <div className="terminal-kicker">YOUR INFRASTRUCTURE</div>
              <div className="terminal-title">Fleet health <span className="health-good"><i/> Operational</span></div>
              <div className="terminal-stats"><div><span>CONNECTED NODES</span><strong>—</strong><small>Connect your first node</small></div><div><span>METRIC STREAM</span><strong>15s</strong><small>Agent reporting interval</small></div></div>
              <div className="terminal-chart"><div className="chart-lines"><i/><i/><i/><i/></div><svg viewBox="0 0 500 110" preserveAspectRatio="none" aria-label="Decorative monitoring waveform"><path d="M0 80 C30 75 40 43 65 55 S95 86 120 60 S160 25 185 49 S220 75 245 52 S280 28 305 48 S340 84 365 56 S405 35 430 49 S470 61 500 20" fill="none" stroke="#48a5ff" strokeWidth="2.5"/><path d="M0 80 C30 75 40 43 65 55 S95 86 120 60 S160 25 185 49 S220 75 245 52 S280 28 305 48 S340 84 365 56 S405 35 430 49 S470 61 500 20 L500 110 L0 110Z" fill="url(#heroFill)" opacity=".35"/><defs><linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#168cff"/><stop offset="1" stopColor="#168cff" stopOpacity="0"/></linearGradient></defs></svg></div>
              <div className="terminal-foot"><span><i className="legend-blue"/> CPU utilization</span><span><i className="legend-green"/> Memory utilization</span><span>LIVE DATA AFTER CONNECTION</span></div>
            </div>
          </div>
          <div className="floating-chip chip-one"><span className="chip-icon"><Radio size={15}/></span><span><b>Agent reporting</b><small>Every 15 seconds</small></span><i className="pulse-dot"/></div>
          <div className="floating-chip chip-two"><span className="chip-icon green-chip"><ShieldCheck size={15}/></span><span><b>Secure registration</b><small>Short-lived token onboarding</small></span></div>
        </div>
      </section>

      <section className="trust-strip shell"><span>BUILT AROUND YOUR LINUX STACK</span><div><b><Terminal size={17}/> Linux</b><b><Zap size={17}/> systemd</b><b><Activity size={17}/> Prometheus</b><b><Gauge size={17}/> Grafana</b><b><Layers3 size={17}/> tRPC</b></div></section>

      <section id="features" className="section shell">
        <div className="section-heading"><div className="eyebrow">ONE FLEET. LESS GUESSWORK.</div><h2>Know what is happening<br/>across your machines.</h2><p>From the first agent installation to deep metric exploration, keep the essentials close.</p></div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon"><Monitor/></span><h3>Node visibility</h3><p>See your registered machines, operating systems, connectivity and the latest report from each node, all tied to your own account.</p><span className="feature-meta">01 / FLEET INVENTORY</span></article>
          <article className="feature-card"><span className="feature-icon feature-green"><Cpu/></span><h3>Resource health</h3><p>Understand CPU, memory, disk and battery information from the reports your agents send.</p><span className="feature-meta">02 / RESOURCE METRICS</span></article>
          <article className="feature-card"><span className="feature-icon feature-purple"><Activity/></span><h3>Deep observability</h3><p>Use Prometheus as the metrics source and Grafana dashboards, embedded right in LinuxFleet, for investigation and history.</p><span className="feature-meta">03 / OBSERVABILITY</span></article>
        </div>
      </section>

      <section id="workflow" className="workflow-section"><div className="shell workflow-inner"><div><div className="eyebrow">GET CONNECTED IN MINUTES</div><h2>From zero nodes<br/>to fleet visibility.</h2><p>Generate a registration token, install the Fleet Agent on your Linux machine and watch it appear in your workspace. Most machines are connected in about 10 minutes.</p><Link href={destination} className="button button-primary">Start onboarding <ArrowRight size={16}/></Link></div><div className="steps"><div className="step"><span>01</span><div><b>Create a node token</b><p>Generate a registration token from your dashboard. It is valid for 10 minutes.</p></div><LockKeyhole/></div><div className="step"><span>02</span><div><b>Install the Fleet Agent</b><p>Clone the agent, run <code>./fleet register</code> and paste your token.</p></div><Terminal/></div><div className="step"><span>03</span><div><b>Start and monitor</b><p>Run <code>./fleet start</code>, then review node reports and open live Grafana dashboards.</p></div><Activity/></div></div></div>

        <div className="shell" style={{ marginTop: 32 }}>
          <div className="terminal-window">
            <div className="terminal-top"><div className="window-dots"><i/><i/><i/></div><span>your-linux-machine / fleet-agent</span></div>
            <div className="terminal-body">
              <div className="terminal-kicker">INSTALL IN FOUR COMMANDS</div>
              <pre style={{ margin: 0, overflowX: "auto", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, lineHeight: 1.7 }}>{`git clone ${AGENT_REPO}.git
cd fleet-agent
./fleet register   # paste your registration token
./fleet start      # runs in the background via systemd`}</pre>
              <div className="terminal-foot"><span>./fleet status</span><span>./fleet stop</span><span>./fleet remove</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="monitoring" className="section shell">
        <div className="section-heading"><div className="eyebrow">ALERTS &amp; AVAILABILITY</div><h2>Know when a node<br/>needs attention.</h2><p>LinuxFleet flags unhealthy and silent machines so you can act early. Administrators also get a platform-wide view of online and offline nodes.</p></div>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon feature-green"><Cpu/></span><h3>CPU alert</h3><p>Triggered when CPU utilization goes above 85%.</p><span className="feature-meta">THRESHOLD / 85%</span></article>
          <article className="feature-card"><span className="feature-icon feature-purple"><Bell/></span><h3>RAM alert</h3><p>Triggered when memory utilization goes above 90%.</p><span className="feature-meta">THRESHOLD / 90%</span></article>
          <article className="feature-card"><span className="feature-icon"><ServerOff/></span><h3>Node offline alert</h3><p>Triggered when a node stops sending metrics for more than two minutes.</p><span className="feature-meta">NO REPORT / 2 MIN</span></article>
        </div>
        <p className="hero-description" style={{ marginTop: 24 }}><Users size={15} style={{ verticalAlign: "-2px" }}/> Each user sees only their own nodes. Admins can review total, online and offline nodes and send alert messages to users.</p>
      </section>

      <section id="get-started" className="bottom-cta shell"><div><div className="eyebrow">YOUR INFRASTRUCTURE, UNDERSTOOD</div><h2>Bring your fleet into focus.</h2><p>Start with one machine. Grow into a complete Linux fleet.</p></div><Link href={destination} className="button button-primary button-large">{ctaLabel} <ArrowRight size={17}/></Link></section>
      <footer className="landing-footer shell"><Link href="/" className="brand-lockup"><span className="brand-symbol"><Activity size={17}/></span><span>linux<span className="brand-accent">fleet</span></span></Link><span>Infrastructure visibility for Linux teams. <a href={AGENT_REPO} target="_blank" rel="noopener noreferrer">Fleet Agent on GitHub</a></span><span>© {new Date().getFullYear()} Linux Fleet</span></footer>
    </main>
  );
}