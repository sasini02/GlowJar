"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { sendMagicLink, type SignInState } from "@/lib/actions/auth";

const initialState: SignInState = { status: "idle" };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg bg-surface-raised p-6 shadow-card">
        <MailCheck className="size-6 text-sage-ink" strokeWidth={1.75} aria-hidden="true" />
        <p className="mt-3 font-serif text-title">Check your inbox.</p>
        <p className="mt-2 text-ink-muted">
          We sent you a sign-in link. Open it on this device and you&apos;ll land straight in your jar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-label text-ink">
        Your email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        aria-describedby={state.status === "error" ? "email-error" : undefined}
        className="min-h-12 rounded-sm border border-line bg-surface-raised px-4 text-body text-ink placeholder:text-ink-muted"
      />
      {state.status === "error" && (
        <p id="email-error" role="alert" className="text-label text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send me a sign-in link"}
      </button>
    </form>
  );
}
