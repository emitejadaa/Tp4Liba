import { cn } from '@/lib/cn';

type Stat = { label: string; value: number; accent?: boolean };

/** Los tres contadores del diseño: Encestadas, Tiros y Racha. */
export function ScoreStats({ stats }: { stats: readonly Stat[] }) {
  return (
    <dl className="flex flex-wrap gap-8">
      {stats.map(({ label, value, accent }) => (
        <div key={label} className="flex items-baseline gap-2">
          <dt className="text-dim text-[15px] tracking-[0.04em] uppercase">{label}</dt>
          <dd
            className={cn(
              'text-[19px] font-bold tabular-nums',
              accent ? 'text-orange' : 'text-chalk',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
