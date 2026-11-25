"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LetterFormState = { error: string | null };

const MAX_LETTER_LENGTH = 10_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function sealLetter(_previous: LetterFormState, formData: FormData): Promise<LetterFormState> {
  await requireUserId();
  const body = String(formData.get("body") ?? "").trim();
  const deliverOn = String(formData.get("deliver_on") ?? "");

  if (!body) return { error: "Write a few lines to your future self first." };
  if (Array.from(body).length > MAX_LETTER_LENGTH) return { error: "Letters can be up to 10,000 characters." };
  if (!ISO_DATE.test(deliverOn)) return { error: "Pick when the letter should arrive." };

  const supabase = await createClient();
  // seal_letter() encrypts the body and checks the date against the author's own "today".
  const { data: letterId, error } = await supabase.rpc("seal_letter", { body, deliver_on: deliverOn });

  if (error) {
    if (error.code === "22023") return { error: "Pick a delivery date between tomorrow and ten years from now." };
    console.error("seal_letter failed", error.code, error.message);
    return { error: "We couldn't seal your letter just now. Your words are still here, so try again in a moment." };
  }

  redirect(`/letters/${letterId}?sealed=1`);
}
