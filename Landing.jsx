import { Link } from "react-router-dom";
import { useStoreVersion } from "../services/useStore.js";
import { getAdminStats } from "../services/store.js";

export default function Landing() {
  useStoreVersion();
  const stats = getAdminStats();

  return (
    <div className="flex-1">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 px-3 py-1 text-xs font-semibold">
            📍 Pilot Area: Multimedia University (MMU), Cyberjaya
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-ink-900">
            Navigate without <span className="text-brand-600">barriers.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-900/70 max-w-xl">
            Real-time accessibility-aware navigation for everyone. okayUway doesn't just tell
            you how far your destination is — it tells you whether you can actually get there.
          </p>
          <blockquote className="mt-6 border-l-4 border-brand-500 pl-4 text-ink-900/80 italic">
            "Normal maps tell you how to get there. okayUway tells you whether you can actually get there."
          </blockquote>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/explore" className="focus-ring rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 text-base shadow-sm shadow-brand-600/20 transition-colors">
              Explore MMU →
            </Link>
            <Link to="/report" className="focus-ring rounded-xl bg-white hover:bg-ink-900/5 text-ink-900 font-semibold px-6 py-3.5 text-base ring-1 ring-ink-900/15 transition-colors">
              Report an Obstacle
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-ink-900/10 shadow-xl shadow-ink-900/5 p-6">
          <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-brand-50 flex items-center justify-center relative">
            <MiniMapPreview />
          </div>
          <p className="text-xs text-ink-900/50 mt-3 text-center">Stylized campus plan — MMU Cyberjaya pilot area</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <p className="text-xs uppercase tracking-wide font-semibold text-ink-900/40 mb-3">Prototype / demo data</p>
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard icon="♿" value="15" label="Accessibility-aware routes" />
          <StatCard icon="📍" value="MMU" label="Cyberjaya pilot campus" />
          <StatCard icon="⚠" value={stats.active} label="Active accessibility reports" />
          <StatCard icon="✓" value={`${stats.resolved}`} label="Community-verified resolutions" />
        </div>
      </section>

      <section className="bg-white border-t border-ink-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-8">
          <Feature icon="🧭" title="Accessibility-aware routing" text="Routes are scored on stairs, ramps, lifts, pavement, and obstacles — not just distance." />
          <Feature icon="📷" title="Community reports + AI" text="Anyone can report an obstacle with a photo; a simulated AI check flags severity instantly." />
          <Feature icon="🔄" title="Live verification loop" text="Confirmations, disputes, and admin review keep the map honest and current." />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-ink-900/10 p-5">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold text-ink-900">{value}</div>
      <div className="text-sm text-ink-900/60">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-lg text-ink-900">{title}</h3>
      <p className="text-sm text-ink-900/60 mt-1.5">{text}</p>
    </div>
  );
}

function MiniMapPreview() {
  return (
    <svg viewBox="0 0 1000 640" className="w-full h-full">
      <rect width="1000" height="640" fill="#eaf5ee" />
      <circle cx="150" cy="150" r="70" fill="#d5f7e2" />
      <circle cx="880" cy="560" r="90" fill="#d5f7e2" />
      {[[130,500,250,480],[250,480,300,420],[300,420,300,260],[300,260,470,190],[470,190,620,150],[470,190,560,300],[560,300,700,320],[300,420,400,470],[420,380,400,470],[400,470,640,420],[640,420,780,480]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b7cabf" strokeWidth="5" strokeLinecap="round" />
      ))}
      {[[130,500,'🚪'],[300,260,'📚'],[470,190,'🏛'],[620,150,'🏛'],[560,300,'🏛'],[700,320,'🏛'],[420,380,'🎭'],[300,420,'🏢'],[400,470,'🍽'],[250,480,'🧑‍🤝‍🧑'],[780,480,'🏟'],[850,220,'🏠']].map(([x,y,e],i)=>(
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="15" fill="#fff" stroke="#94a89d" strokeWidth="2" />
          <text textAnchor="middle" dy="5" fontSize="14">{e}</text>
        </g>
      ))}
    </svg>
  );
}
