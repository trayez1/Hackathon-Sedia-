import { useState } from "react";
import { userLogin, userRegister } from "../services/store.js";

// Standalone user sign-in / sign-up screen. Kept separate from
// pages/admin/AdminLogin.jsx: this is for regular students/staff and posts
// to /api/auth/*, while AdminLogin.jsx posts to /api/admin/login and is only
// ever reachable from the /admin route.
export default function UserLogin({ onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isRegister) {
        await userRegister(form.name, form.email, form.password);
      } else {
        await userLogin(form.email, form.password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white ring-1 ring-ink-900/10 p-6 shadow-sm">
        <h1 className="text-lg font-bold text-ink-900">
          {isRegister ? "Create your account" : "Sign in"}
        </h1>
        <p className="text-sm text-ink-900/60 mt-1 mb-5">
          {isRegister
            ? "Sign up to save reports and track your accessibility routes."
            : "Welcome back to okayUway."}
        </p>

        {isRegister && (
          <>
            <label htmlFor="user-name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="user-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm mb-3"
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </>
        )}

        <label htmlFor="user-email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="user-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm mb-3"
          placeholder="you@mmu.edu.my"
          autoComplete="username"
          required
        />

        <label htmlFor="user-password" className="block text-sm font-medium mb-1">Password</label>
        <input
          id="user-password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm mb-3"
          placeholder="••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          required
        />

        {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full rounded-xl bg-brand-600 hover:bg-brand-600/90 disabled:opacity-60 text-white font-semibold px-4 py-3 text-sm"
        >
          {submitting ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}
        </button>

        <p className="text-xs text-ink-900/60 mt-4 text-center">
          {isRegister ? "Already have an account?" : "New to okayUway?"}{" "}
          <button
            type="button"
            onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }}
            className="focus-ring font-semibold text-brand-600 hover:underline"
          >
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </form>
    </div>
  );
}
