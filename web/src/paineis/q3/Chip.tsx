/** Selo de partido na cor do espectro (a cor vem dos dados, por isso o style inline). */
export function Chip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-[4px] border-l-4 px-[7px] py-px text-[12.5px] font-bold whitespace-nowrap"
      style={{ borderLeftColor: cor, background: `color-mix(in srgb, ${cor} 14%, #fff)` }}
    >
      {children}
    </span>
  );
}
