import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileContext.jsx";
import NavBar from "./components/NavBar.jsx";
import Landing from "./pages/Landing.jsx";
import Explore from "./pages/Explore.jsx";
import ReportObstacle from "./pages/ReportObstacle.jsx";
import Admin from "./pages/Admin.jsx";
import UserLogin from "./pages/UserLogin.jsx";
import Profile from "./pages/Profile.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import { useStoreVersion } from "./services/useStore.js";
import { isReady, getBootstrapError, retryBootstrap, isUserLoggedIn } from "./services/store.js";

export default function App() {
  useStoreVersion();
  const ready = isReady();
  const error = getBootstrapError();

  return (
    <ProfileProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1 flex flex-col">
            {!ready ? (
              <BootstrapGate error={error} />
            ) : (
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/report" element={<ReportObstacle />} />
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/profile" element={<ProfileRoute />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            )}
          </main>
        </div>
      </BrowserRouter>
    </ProfileProvider>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  if (isUserLoggedIn()) return <Navigate to="/" replace />;
  return <UserLogin onSuccess={() => navigate("/")} />;
}

function ProfileRoute() {
  if (!isUserLoggedIn()) return <Navigate to="/login" replace />;
  return <Profile />;
}

function BootstrapGate({ error }) {
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl bg-white ring-1 ring-red-200 p-6 text-center">
          <p className="text-2xl mb-2">⚠</p>
          <p className="font-semibold text-ink-900">Can't reach the okayUway server</p>
          <p className="text-sm text-ink-900/60 mt-1.5">{error.message}</p>
          <button
            onClick={() => retryBootstrap()}
            className="focus-ring mt-4 rounded-xl bg-ink-900 hover:bg-ink-900/90 text-white font-semibold px-4 py-2.5 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-ink-900/50">
        <p className="text-2xl mb-2 animate-pulse">♿</p>
        <p className="text-sm">Loading campus data…</p>
      </div>
    </div>
  );
}
