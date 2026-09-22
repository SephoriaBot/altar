import { BirthChartForm } from './BirthChartForm';

export function ChartTab() {
  return (
    <section className="chart-tab">
      <h2>Natal Chart</h2>
      <p className="muted small">Enter birth details to calculate a chart alongside your tarot readings.</p>
      <BirthChartForm />
    </section>
  );
}
