import { useState } from "react";
import { Bug, CheckCircle2, Lightbulb, Loader2, Mail, MessageCircle, Send, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildMailtoLink, sendFeedback, type FeedbackCategory } from "@/lib/feedback";

const CATEGORIES: { id: FeedbackCategory; label: string; icon: typeof Bug }[] = [
  { id: "bug", label: "Bug", icon: Bug },
  { id: "feature", label: "Idea", icon: Lightbulb },
  { id: "general", label: "Other", icon: MessageCircle },
];

const MAX_LENGTH = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "w-full rounded-xl border border-white/10 glass-inset px-3.5 py-2.5 text-xs text-white" +
  "placeholder:text-on-surface-muted/45 focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200";

export function FeedbackView() {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const emailInvalid = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);
  const canSubmit = message.trim().length >= 5 && !emailInvalid && status !== "sending";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("sending");
    setError(null);
    try {
      await sendFeedback({ category, message, email: trimmedEmail, rating });
      setStatus("sent");
    } catch (err) {
      console.error("Feedback submission failed:", err);
      setError("We couldn't send your feedback right now. Check your connection and try again, or email us directly.");
      setStatus("error");
    }
  }

  function reset() {
    setCategory("general");
    setRating(0);
    setMessage("");
    setEmail("");
    setStatus("idle");
    setError(null);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-base font-bold text-white">Thanks for the feedback!</h2>
        <p className="max-w-[280px] text-xs leading-relaxed text-on-surface-muted">
          It's on its way to our team.{" "}
          {trimmedEmail ? "We'll reply to the email you gave us if we need more detail." : ""}
        </p>
        <button
          onClick={reset}
          className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 cursor-pointer"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2" noValidate>
      <p className="text-xs leading-relaxed text-on-surface-muted">
        Found a bug or have an idea? Tell us. Your message goes straight to the FocusFlow team.
      </p>

      {/* Category */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">Type</legend>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={active}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer",
                  active
                    ? "border-primary/40 bg-gradient-to-r from-primary/15 to-secondary/15 text-white"
                    : "border-white/5 bg-white/[0.05] text-on-surface-muted hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "opacity-70")} />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Rating */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
          How's FocusFlow so far? <span className="font-medium normal-case tracking-normal text-on-surface-muted/70">(optional)</span>
        </p>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(rating === n ? 0 : n)}
              className="rounded-md p-1 transition-transform hover:scale-110 cursor-pointer"
            >
              <Star
                className={cn("h-5 w-5", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600")}
                strokeWidth={1.8}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="fb-message" className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-primary">
          Message
        </label>
        <textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          rows={5}
          required
          placeholder={
            category === "bug"
              ? "What happened, and what did you expect to happen?"
              : category === "feature"
                ? "What would make FocusFlow more useful for you?"
                : "Tell us what's on your mind…"
          }
          className={cn(fieldClass, "resize-none leading-relaxed")}
        />
        <p className="mt-1 text-right text-[10px] text-on-surface-muted/60">
          {message.length}/{MAX_LENGTH}
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="fb-email" className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-primary">
          Your email <span className="font-medium normal-case tracking-normal text-on-surface-muted/70">(optional, if you'd like a reply)</span>
        </label>
        <input
          id="fb-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={emailInvalid}
          className={cn(fieldClass, emailInvalid && "border-error/50 focus:border-error/60 focus:ring-error/30")}
        />
        {emailInvalid && <p className="mt-1 text-[10px] text-error">Please enter a valid email address.</p>}
      </div>

      {status === "error" && error && (
        <div className="space-y-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-rose-300">{error}</p>
          <a
            href={buildMailtoLink({ category, message, email: trimmedEmail, rating })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white underline-offset-2 hover:underline"
          >
            <Mail className="h-3.5 w-3.5" /> Email us instead
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white transition-all duration-200 cursor-pointer",
          "gradient-primary hover:shadow-[0_4px_16px_color-mix(in_oklab,var(--accent-1)_30%,transparent)] active:scale-[0.99]",
          "disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
        )}
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send Feedback
          </>
        )}
      </button>

      <p className="pb-2 text-center text-[10px] leading-relaxed text-on-surface-muted/60">
        To help us debug, we attach your FocusFlow version and browser details. Nothing else is collected.
      </p>
    </form>
  );
}
