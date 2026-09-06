import { useState } from "react";
import { adminLogin } from "../../services/store.js";

export default function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await adminLogin(form.email, form.password);
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white ring-1 ring-ink-900/10 p-6 shadow-sm">
        <h1 className="text-lg font-bold text-ink-900">Administrator sign in</h1>
        <p className="text-sm text-ink-900/60 mt-1 mb-5">Campus facilities & accessibility officers only.</p>

        <label htmlFor="admin-email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="admin-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm mb-3"
          placeholder="admin@mmu.demo"
          autoComplete="username"
          required
        />

        <label htmlFor="admin-password" className="block text-sm font-medium mb-1">Password</label>
        <input
          id="admin-password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm mb-3"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && <p className="text-xs text-red-600 mb-3" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full rounded-xl bg-ink-900 hover:bg-ink-900/90 disabled:opacity-60 text-white font-semibold px-4 py-3 text-sm"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-ink-900/40 mt-4 text-center">
          Demo credentials are set in <code>backend/.env</code> (default: admin@mmu.demo / demo1234).
        </p>
      </form>
    </div>
  );
}
