import { useI18n } from '../i18n/useI18n';

interface Item {
  key: 'healthy' | 'damaged' | 'excited' | 'refractory' | 'ablated';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

const ITEMS: Item[] = [
  { key: 'healthy', fill: '#e9eef5', stroke: '#78909c', strokeWidth: 1 },
  { key: 'damaged', fill: '#e9eef5', stroke: '#c2185b', strokeWidth: 2 },
  { key: 'excited', fill: '#e53935', stroke: '#78909c', strokeWidth: 1 },
  { key: 'refractory', fill: '#90a4ae', stroke: '#78909c', strokeWidth: 1 },
  { key: 'ablated', fill: '#212121', stroke: '#78909c', strokeWidth: 1 },
];

export function Legend() {
  const { t } = useI18n();
  const labels: Record<Item['key'], string> = {
    healthy: t.legendHealthy,
    damaged: t.legendDamaged,
    excited: t.legendExcited,
    refractory: t.legendRefractory,
    ablated: t.legendAblated,
  };
  return (
    <div className="legend" aria-label={t.legendHeading}>
      <h3>{t.legendHeading}</h3>
      <ul>
        {ITEMS.map((item) => (
          <li key={item.key}>
            <svg width={18} height={18} aria-hidden="true">
              <circle
                cx={9}
                cy={9}
                r={7}
                fill={item.fill}
                stroke={item.stroke}
                strokeWidth={item.strokeWidth}
              />
            </svg>
            <span>{labels[item.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
