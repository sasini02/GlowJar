"use client";

import { useActionState, useId, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/lib/actions/account";

const initialState: DeleteAccountState = { error: null };

export function DeleteAccount({ username }: { username: string }) {
  const [state, formAction, deleting] = useActionState(deleteAccount, initialState);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const inputId = useId();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 w-fit items-center rounded-md border border-line px-6 text-label text-danger transition-colors duration-200 hover:bg-surface-raised"
      >
        Delete my account
      </button>
    );
  }

  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-md border border-line bg-surface p-5">
      <p className="text-ink">
        This deletes your account and everything in it: every win, every letter (sealed ones too), your celebrations
        and your recaps. It can&apos;t be undone. If you&apos;d like a copy, download your data first.
      </p>
      <label htmlFor={inputId} className="text-label text-ink">
        Type <span className="font-semibold">{username}</span> to confirm
      </label>
      <input
        id={inputId}
        name="confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        className="min-h-12 rounded-sm border border-line bg-surface px-4 text-body text-ink"
      />
      {state.error && (
        <p role="alert" className="text-label text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-6 text-label text-ink"
        >
          Keep my account
        </button>
        <button
          type="submit"
          disabled={!matches || deleting}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-danger px-6 text-label text-surface disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete everything"}
        </button>
      </div>
    </form>
  );
}
