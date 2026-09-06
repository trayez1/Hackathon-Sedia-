import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useStoreVersion } from "../services/useStore.js";
import {
  getLocations, getFeaturesForLocation, submitReport, runAIAnalysis,
  confirmReport, disputeReport, getReports, getConfidence, getPhotoUrl,
  isUserLoggedIn,
} from "../services/store.js";
import { SeverityBadge, StatusPill, ConfidenceChip } from "../components/Badges.jsx";
import PointsToast from "../components/PointsToast.jsx";
import { timeAgo } from "../utils/time.js";

const OBSTACLE_TYPES = [
  "Broken lift", "Blocked ramp", "Stairs (no alternative)", "Broken pavement",
  "Construction", "Closed entrance", "Steep slope", "Other",
];

export default function ReportObstacle() {
  useStoreVersion();
  const navState = useLocation().state;
  const locations = getLocations();

  const [locationId, setLocationId] = useState(navState?.locationId || locations[0].id);
  const [featureId, setFeatureId] = useState("");
  const [type, setType] = useState(OBSTACLE_TYPES[1]);
  const [description, setDescription] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const features = getFeaturesForLocation(locationId);
  const loggedIn = isUserLoggedIn();

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((er) => ({ ...er, photo: "Please upload an image file." }));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrors((er) => ({ ...er, photo: "Image is too large (max 8MB)." }));
      return;
    }
    setErrors((er) => ({ ...er, photo: null }));
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result);
    reader.readAsDataURL(file);
    setAiAnalysis(null);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const result = await runAIAnalysis({ obstacleType: type, hasPhoto: !!photoDataUrl });
    setAiAnalysis(result);
    setAnalyzing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    if (!description.trim()) newErrors.description = "Please describe the obstacle.";
    if (!photoDataUrl) newErrors.photo = "Photo evidence is required to submit a report.";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setSubmitting(true);
    setErrors((er) => ({ ...er, submit: null }));
    try {
      const report = await submitReport({
        locationId, featureId: featureId || null, type, description, photoDataUrl,
        aiAnalysis: aiAnalysis ? { impact: aiAnalysis.impact } : null,
      });
      setSubmitted(report);
      setDescription(""); setPhotoDataUrl(null); setAiAnalysis(null); setFeatureId("");
      if (report.pointsAwarded) {
        setToast(`+${report.pointsAwarded} points! Thank you for helping improve accessibility.`);
      }
    } catch (err) {
      setErrors((er) => ({ ...er, submit: err.message || "Could not submit report. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  }

  const recentReports = getReports().slice(0, 6);

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Report an obstacle</h1>
        <p className="text-sm text-ink-900/60 mt-1 mb-6">
          Help other users by reporting broken lifts, blocked ramps, or damaged paths. Reports are reviewed by the community and campus administrators.
        </p>

        {!loggedIn ? (
          <div className="rounded-2xl bg-white ring-1 ring-ink-900/10 p-6">
            <p className="font-semibold text-ink-900">Log in to submit a report</p>
            <p className="text-sm text-ink-900/60 mt-1.5">
              Reports are tied to your account so you earn points and build up your contribution history.
            </p>
            <Link
              to="/login"
              className="focus-ring inline-block mt-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 text-sm"
            >
              Sign in
            </Link>
          </div>
        ) : submitted ? (
          <div className="rounded-2xl bg-brand-50 ring-1 ring-brand-200 p-6">
            <p className="text-brand-700 font-semibold text-lg">✓ Report submitted</p>
            <p className="text-sm text-ink-900/70 mt-1">Status: <StatusPill status={submitted.status} /></p>
            {submitted.pointsAwarded && (
              <p className="text-sm font-semibold text-brand-700 mt-2">+{submitted.pointsAwarded} points earned</p>
            )}
            <p className="text-sm text-ink-900/60 mt-3">Thank you — your report will appear on the map and be reviewed for verification.</p>
            <button onClick={() => setSubmitted(null)} className="focus-ring mt-4 rounded-lg bg-white ring-1 ring-ink-900/15 px-4 py-2 text-sm font-medium hover:bg-ink-900/5">
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Field label="Location">
              <select value={locationId} onChange={(e) => { setLocationId(e.target.value); setFeatureId(""); }} className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm">
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>

            <Field label="Related feature (optional)">
              <select value={featureId} onChange={(e) => setFeatureId(e.target.value)} className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm">
                <option value="">— Not sure / general area —</option>
                {features.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>

            <Field label="Obstacle type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm">
                {OBSTACLE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Description" error={errors.description}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Motorcycle blocking wheelchair ramp"
                className="focus-ring w-full rounded-xl ring-1 ring-ink-900/15 px-4 py-2.5 text-sm"
                aria-invalid={!!errors.description}
              />
            </Field>

            <Field label="Photo evidence (required)" error={errors.photo}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                required
                aria-invalid={!!errors.photo}
                className="focus-ring block w-full text-sm text-ink-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:px-3 file:py-2 file:font-medium"
              />
              <p className="text-[11px] text-ink-900/45 mt-1.5">A photo helps administrators verify the report faster.</p>
              {photoDataUrl && (
                <div className="mt-3">
                  <img src={photoDataUrl} alt="Uploaded obstacle evidence" className="rounded-xl max-h-48 ring-1 ring-ink-900/10" />
                  <button type="button" onClick={handleAnalyze} disabled={analyzing} className="focus-ring mt-2 rounded-lg bg-ink-900 hover:bg-ink-900/90 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2">
                    {analyzing ? "Analyzing photo…" : "🤖 Run AI accessibility analysis"}
                  </button>
                </div>
              )}
            </Field>

            {aiAnalysis && <AIAnalysisCard analysis={aiAnalysis} />}

            {errors.submit && <p className="text-xs text-red-600" role="alert">{errors.submit}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-4 py-3.5 text-base"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-900/70 mb-3">Recent community reports</h2>
        <div className="space-y-3">
          {recentReports.map((r) => (
            <ReportRow key={r.id} report={r} loggedIn={loggedIn} onPoints={setToast} />
          ))}
        </div>
      </div>

      <PointsToast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-900/70 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}

function AIAnalysisCard({ analysis }) {
  return (
    <div className="rounded-2xl bg-ink-900 text-white p-4">
      <p className="text-xs uppercase tracking-wide text-white/50 font-semibold mb-2">AI Accessibility Analysis <span className="italic">(simulated demo response)</span></p>
      <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-white/60">Ramp detected</dt><dd>{analysis.rampDetected ? "✓ Yes" : "— N/A"}</dd>
        <dt className="text-white/60">Obstruction detected</dt><dd>{analysis.obstructionDetected ? "✓ Yes" : "No"}</dd>
        {analysis.object && <><dt className="text-white/60">Object</dt><dd>{analysis.object}</dd></>}
        <dt className="text-white/60">Accessibility impact</dt><dd className="font-semibold">{analysis.impact}</dd>
      </dl>
      <p className="text-xs text-white/60 mt-3">Recommendation: {analysis.recommendation}</p>
    </div>
  );
}

function ReportRow({ report, loggedIn, onPoints }) {
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setRowError("");
    try {
      const updated = await confirmReport(report.id);
      if (updated.pointsAwarded) {
        onPoints?.(`+${updated.pointsAwarded} points! Thank you for helping improve accessibility.`);
      }
    } catch (err) {
      setRowError(err.message || "Could not confirm this report.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDispute() {
    setBusy(true);
    setRowError("");
    try {
      await disputeReport(report.id);
    } catch (err) {
      setRowError(err.message || "Could not dispute this report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl ring-1 ring-ink-900/10 p-4 bg-white">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-ink-900">{report.type}</span>
        <SeverityBadge severity={report.severity} />
      </div>
      <p className="text-xs text-ink-900/50 mt-0.5">{timeAgo(report.createdAt)}</p>
      <p className="text-sm text-ink-900/80 mt-2">"{report.description}"</p>
      {report.photoDataUrl && (
        <a href={getPhotoUrl(report.photoDataUrl)} target="_blank" rel="noopener noreferrer" className="focus-ring block mt-2 rounded-lg overflow-hidden ring-1 ring-ink-900/10 w-fit">
          <img
            src={getPhotoUrl(report.photoDataUrl)}
            alt={`Photo evidence for ${report.type} report`}
            className="max-h-32 object-cover"
          />
        </a>
      )}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <ConfidenceChip confirmations={report.confirmations} disputes={report.disputes} />
        <StatusPill status={report.status} />
      </div>

      {rowError && <p className="text-xs text-red-600 mt-2" role="alert">{rowError}</p>}

      {report.status !== "resolved" && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {!loggedIn ? (
            <Link to="/login" className="focus-ring text-xs font-semibold text-brand-600 hover:underline">
              Log in to confirm or dispute this report
            </Link>
          ) : report.isOwnReport ? (
            <span className="text-xs text-ink-900/40 italic">This is your report</span>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                disabled={busy || report.confirmedByMe}
                className="focus-ring rounded-lg bg-brand-50 hover:bg-brand-100 disabled:opacity-60 text-brand-700 text-xs font-semibold px-3 py-1.5 ring-1 ring-brand-200"
              >
                {report.confirmedByMe ? "✓ You confirmed this" : "✓ Yes, still present"}
              </button>
              <button
                onClick={handleDispute}
                disabled={busy}
                className="focus-ring rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 text-xs font-semibold px-3 py-1.5 ring-1 ring-red-200"
              >
                ✕ No, resolved
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
