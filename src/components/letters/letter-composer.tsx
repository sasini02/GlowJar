"use client";

import { useActionState, useId, useState } from "react";
import { sealLetter, type LetterFormState } from "@/lib/actions/letters";
import { addDays, addMonths, formatLongDate } from "@/lib/dates";

type DeliveryChoice = "3m" | "6m" | "1y" | "custom";

const CHOICES: { value: DeliveryChoice; label: string; months?: number }[] = [
  { value: "3m", label: "In 3 months", months: 3 },
  { value: "6m", label: "In 6 months", months: 6 },
  { value: "1y", label: "In a year", months: 12 },
  { value: "custom", label: "Pick a date" },
];

const initialState: LetterFormState = { error: null };

/** `today` is the writer's local date, passed from the server so the dates never depend on the browser clock. */
export function LetterComposer({ today }: { today: string }) {
  const [state, formAction, sealing] = useActionState(sealLetter, initialState);
  const [body, setBody] = useState("");
  const [choice, setChoice] = useState<DeliveryChoice>("6m");
  const [customDate, setCustomDate] = useState(addMonths(today, 1));
  const ids = useId();

  const months = CHOICES.find((option) => option.value === choice)?.months;
  const deliverOn = months ? addMonths(today, months) : customDate;
  const tomorrow = addDays(today, 1);
  const latest = addMonths(today, 120);
  const dateIsValid = Boolean(deliverOn) && deliverOn >= tomorrow && deliverOn <= latest;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="deliver_on" value={deliverOn} />

      <div>
        <label htmlFor={`${ids}-body`} className="sr-only">
          Your letter
        </label>
        <textarea
          id={`${ids}-body`}
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          maxLength={10_000}
          placeholder="Dear future me,"
          className="lined-paper block w-full resize-y rounded-lg px-7 py-[14px] font-serif text-win-text text-ink shadow-card placeholder:text-ink-muted"
        />
      </div>

      <fieldset>
        <legend className="text-label text-ink">When should it arrive?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CHOICES.map((option) => (
            <label
              key={option.value}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-md border px-4 text-label text-ink transition-colors duration-200 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring ${
                choice === option.value ? "border-dusk bg-surface-raised" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="delivery_choice"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {choice === "custom" && (
          <div className="mt-3">
            <label htmlFor={`${ids}-date`} className="text-label text-ink">
              Delivery date
            </label>
            <input
              id={`${ids}-date`}
              type="date"
              value={customDate}
              min={tomorrow}
              max={latest}
              onChange={(event) => setCustomDate(event.target.value)}
              className="mt-1 block min-h-12 rounded-sm border border-line bg-surface-raised px-4 text-body text-ink"
            />
          </div>
        )}
      </fieldset>

      <p className="rounded-md bg-dusk px-4 py-3 text-label text-on-dusk">
        {dateIsValid
          ? `Arrives on ${formatLongDate(deliverOn)}. You won't be able to open it before then.`
          : "Pick a date between tomorrow and ten years from now."}
      </p>

      {state.error && (
        <p role="alert" className="text-label text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!body.trim() || !dateIsValid || sealing}
        className="inline-flex min-h-12 items-center justify-center rounded-md bg-glow px-6 text-label text-on-glow shadow-card transition-shadow duration-200 hover:shadow-lift disabled:opacity-60 disabled:shadow-none"
      >
        {sealing ? "Sealing…" : "Seal the letter"}
      </button>
    </form>
  );
}
