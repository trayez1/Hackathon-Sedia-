import { NavLink } from "react-router-dom";
import { useStoreVersion } from "../services/useStore.js";
import { isUserLoggedIn, getUserName, userLogout } from "../services/store.js";

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium focus-ring transition-colors ${
    isActive ? "bg-brand-600 text-white" : "text-ink-900/70 hover:bg-ink-900/5"
  }`;

function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function NavBar() {
  useStoreVersion(); // re-render on login/logout, same as other store changes
  const loggedIn = isUserLoggedIn();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2 focus-ring rounded-lg" aria-label="okayUway home">
          <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg">o</span>
          <span className="font-bold text-lg tracking-tight">okay<span className="text-brand-600">U</span>way</span>
        </NavLink>
        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavLink to="/explore" className={linkCls}>Explore Map</NavLink>
          <NavLink to="/report" className={linkCls}>Report Obstacle</NavLink>
          <NavLink to="/leaderboard" className={linkCls}>Leaderboard</NavLink>
          <NavLink to="/admin" className={linkCls}>Admin</NavLink>
          {loggedIn ? (
            <>
              <NavLink
                to="/profile"
                className="focus-ring flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium text-ink-900/70 hover:bg-ink-900/5"
                title={`View profile — signed in as ${getUserName()}`}
              >
                <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                  {initials(getUserName())}
                </span>
                <span className="hidden sm:inline">{getUserName()}</span>
              </NavLink>
              <button
                onClick={userLogout}
                className="focus-ring px-3 py-2 rounded-lg text-sm font-medium text-ink-900/70 hover:bg-ink-900/5"
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkCls}>Login</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
