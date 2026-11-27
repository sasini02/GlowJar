import { describe, expect, it } from "vitest";
import { guessCategory } from "./categories";

describe("guessCategory", () => {
  it("reads a category from the win's words", () => {
    expect(guessCategory("Went for a 10 minute walk even though I didn't feel like it.")).toBe("health");
    expect(guessCategory("Submitted the assignment a day early for once.")).toBe("work");
    expect(guessCategory("Told my sister I'm proud of her.")).toBe("social");
    expect(guessCategory("Read ten pages before bed.")).toBe("learning");
    expect(guessCategory("Took a nap without feeling guilty.")).toBe("self_care");
    expect(guessCategory("Let a worry pass.")).toBe("mind");
  });

  it("falls back to Mind when nothing matches", () => {
    expect(guessCategory("Did the thing.")).toBe("mind");
  });
});
