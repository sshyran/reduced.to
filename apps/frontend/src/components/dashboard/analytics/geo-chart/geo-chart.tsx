import { NoSerialize, component$, noSerialize, useSignal, useVisibleTask$, Signal } from '@builder.io/qwik';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { authorizedFetch } from '../../../../shared/auth.service';
import { isDarkMode } from '../../../theme-switcher/theme-switcher';
import { formatDataForChart, groupByCountry } from './util';

interface GeoChartProps {
  urlKey: string;
  url: string;
  daysDuration: number;
  initialData: { geo: { country: string } }[];
}

export type GeoChartData = {
  x: string;
  y: number;
}[];

export const GeoChart = component$((props: GeoChartProps) => {
  const chartRef = useSignal<HTMLDivElement>();
  const chartInstance = useSignal<NoSerialize<ApexCharts> | null>(null);
  const isInitialized = useSignal(false);
  const initialFormattedData = groupByCountry(props.initialData);

  useVisibleTask$(async ({ track }) => {
    track(() => props.daysDuration);

    const response = await fetchChartData(props.urlKey, props.daysDuration);
    const data = groupByCountry(response);
    const formattedData = formatDataForChart(data);

    if (!chartInstance.value) {
      const options: ApexOptions = {
        chart: {
          type: 'bar',
          height: 350,
          toolbar: {
            show: false,
          },
          background: 'transparent',
        },
        plotOptions: {
          bar: {
            horizontal: true,
          },
        },
        series: [
          {
            name: 'Visits',
            data: formatDataForChart(initialFormattedData),
          },
        ],
        xaxis: {
          categories: [...initialFormattedData.keys()],
          title: {
            text: 'Count',
          },
        },
        yaxis: {
          title: {
            text: 'Country',
          },
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          show: false,
        },
        theme: {
          mode: isDarkMode() ? 'dark' : 'light',
          palette: 'palette1',
        },
      };

      chartInstance.value = noSerialize(new ApexCharts(chartRef.value!, options));
      chartInstance.value!.render();
      window.addEventListener('theme-toggled', (ev) => {
        const theme = (ev as CustomEvent).detail.theme;
        chartInstance.value!.updateOptions({ theme: { mode: theme, palette: 'palette1' } });
      });

      isInitialized.value = true;
    } else {
      chartInstance.value.updateSeries([{ name: 'Visits', data: formattedData }]);
    }
  });

  return (
    <>
      <div class="sm:w-1/2 w-full bg-white rounded-lg shadow dark:bg-slate-800 p-4 md:p-6">
        <div ref={chartRef} class="chart-container" />
      </div>
    </>
  );
});

async function fetchChartData(key: string, days: number): Promise<{ geo: { country: string } }[]> {
  try {
    const response = await authorizedFetch(`${process.env.CLIENTSIDE_API_DOMAIN}/api/v1/analytics/${key}/data?days=${days}`);
    return response.json();
  } catch (err) {
    console.error('Could not fetch chart data', err);
    return [];
  }
}
