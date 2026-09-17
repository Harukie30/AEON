export function CommandModule({
  blurb,
  code,
  title,
}: {
  blurb: string;
  code: string;
  title: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-6 sm:px-10">
      <p className="font-mono text-[11px] tracking-[0.3em] text-aeon-cyan/70">{code}</p>
      <h1 className="font-display text-3xl tracking-[0.16em] text-white sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-xl text-sm leading-7 text-foreground/65">{blurb}</p>
    </div>
  );
}
