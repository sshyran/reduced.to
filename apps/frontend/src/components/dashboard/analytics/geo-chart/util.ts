import { GeoChartData } from './geo-chart';

export const groupByCountry = (data: { geo?: { country?: string } }[]) => {
  return data.reduce((acc, item) => {
    // Safely access the country property, default to 'Unknown' if not present
    const country = item.geo?.country || 'Unknown';

    if (acc.has(country)) {
      acc.set(country, acc.get(country)! + 1);
    } else {
      acc.set(country, 1);
    }

    return acc;
  }, new Map<string, number>());
};

export function formatDataForChart(data: Map<string, number>): GeoChartData {
  return Array.from(data, ([country, count]) => ({
    x: country,
    y: count,
  }));
}
