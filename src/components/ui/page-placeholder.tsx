type PagePlaceholderProps = {
  title: string;
  description: string;
};

/** Stand-in for screens that are built in a later phase. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="font-serif text-display">{title}</h1>
      <p className="mt-4 text-ink-muted">{description}</p>
    </section>
  );
}
