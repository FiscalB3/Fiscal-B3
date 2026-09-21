import { formatCents, type PositionJson } from "./api";

const SLICE_COLORS = ["#820ad1", "#1db954", "#5b21b6", "#c084fc", "#0f766e"];

type Slice = {
  key: string;
  label: string;
  cents: number;
};

export function AllocationChart({
  rows,
  selected,
  onSelect,
}: {
  rows: readonly PositionJson[];
  selected: string | null;
  onSelect: (ticker: string) => void;
}) {
  const slices: Slice[] = rows.map((row) => ({
    key: row.ticker,
    label: row.ticker,
    cents: Math.max(0, row.acquisitionCost.cents),
  }));
  const total = slices.reduce((sum, slice) => sum + slice.cents, 0);
  const active = slices.find((slice) => slice.key === selected) ?? slices[0];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="chart-card">
      <p className="chart-title">Como seu custo está distribuído</p>
      <div className="donut-wrap">
        <svg viewBox="0 0 120 120" className="donut" role="img" aria-label="Gráfico de composição da carteira">
          <circle cx="60" cy="60" r={radius} className="donut-track" />
          {total > 0 &&
            slices.map((slice, index) => {
              const length = (slice.cents / total) * circumference;
              const dash = `${length} ${circumference - length}`;
              const dashOffset = circumference * 0.25 - offset;
              offset += length;
              const dimmed = selected !== null && selected !== slice.key;
              return (
                <circle
                  key={slice.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  className="donut-slice"
                  stroke={SLICE_COLORS[index % SLICE_COLORS.length]}
                  strokeDasharray={dash}
                  strokeDashoffset={dashOffset}
                  opacity={dimmed ? 0.28 : 1}
                  onClick={() => onSelect(slice.key)}
                >
                  <title>{`${slice.label}: ${formatCents(slice.cents)}`}</title>
                </circle>
              );
            })}
        </svg>
        {active && (
          <div className="donut-center">
            <strong>{active.label}</strong>
            <span>{total > 0 ? `${Math.round((active.cents / total) * 100)}%` : "0%"}</span>
          </div>
        )}
      </div>
      <ul className="legend">
        {slices.map((slice, index) => (
          <li key={slice.key}>
            <button
              type="button"
              className={selected === slice.key ? "legend-btn is-on" : "legend-btn"}
              onClick={() => onSelect(slice.key)}
            >
              <span className="swatch" style={{ background: SLICE_COLORS[index % SLICE_COLORS.length] }} />
              {slice.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompareBars({
  items,
}: {
  items: readonly { label: string; cents: number; tone: "money" | "brand" | "muted" }[];
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.cents)), 1);

  return (
    <div className="chart-card" role="img" aria-label="Gráfico da apuração mensal">
      <p className="chart-title">Resumo da apuração</p>
      <ul className="bars">
        {items.map((item) => (
          <li key={item.label}>
            <div className="bar-meta">
              <span>{item.label}</span>
              <strong>{formatCents(item.cents)}</strong>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill tone-${item.tone}`}
                style={{ width: `${Math.max(6, (Math.abs(item.cents) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncomeBars({
  lines,
}: {
  lines: readonly { kind: string; amount: { cents: number } }[];
}) {
  const max = Math.max(...lines.map((line) => Math.abs(line.amount.cents)), 1);

  return (
    <div className="chart-card" role="img" aria-label="Gráfico de rendimentos do ano">
      <p className="chart-title">Seus rendimentos no ano</p>
      <ul className="bars">
        {lines.map((line) => (
          <li key={line.kind}>
            <div className="bar-meta">
              <span>{line.kind.replaceAll("_", " ")}</span>
              <strong>{formatCents(line.amount.cents)}</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill tone-money"
                style={{ width: `${Math.max(6, (Math.abs(line.amount.cents) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
