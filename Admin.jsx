import { useState } from "react";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import { isAdminLoggedIn, adminLogout } from "../services/store.js";

// Thin container: tracks whether an admin JWT session is active (restored
// from localStorage on load by store.js) and swaps between the two
// standalone admin screens.
export default function Admin() {
  const [authed, setAuthed] = useState(() => isAdminLoggedIn());

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }
  return <AdminDashboard onSignOut={() => { adminLogout(); setAuthed(false); }} />;
}
