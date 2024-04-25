import { NoSerialize, component$, noSerialize, useSignal, useVisibleTask$, Signal } from '@builder.io/qwik';
import ApexCharts, { ApexOptions } from 'apexcharts';
import { authorizedFetch } from '../../../../shared/auth.service';
import { isDarkMode } from '../../../theme-switcher/theme-switcher';
import { fillMissingDates, getDateFormatter } from './utils';
import { LuBarChart } from '@qwikest/icons/lucide';

interface ClicksChartProps {
  urlKey: string;
  url: string;
  daysDuration: number;
  initialData: { day: string; count: string }[];
}

export type ChartData = {
  x: Date;
  y: number;
}[];

export const ClicksChart = component$((props: ClicksChartProps) => {
  const chartRef = useSignal<HTMLDivElement>();
  const chartInstance = useSignal<NoSerialize<ApexCharts> | null>(null);
  const isInitialized = useSignal(false);
  const totalClicks = useSignal(props.initialData.reduce((acc, { count }) => acc + parseInt(count, 10), 0));
  const chartDescription = useSignal('7 days');

  useVisibleTask$(async ({ track }) => {
    track(() => props.daysDuration);

    const data: { clicksOverTime: { day: string; count: string }[] } = await fetchChartData(props.urlKey, props.daysDuration);
    const filledData = fillMissingDates(data.clicksOverTime, props.daysDuration);
    const formatter = getDateFormatter(props.daysDuration);
    totalClicks.value = data.clicksOverTime.reduce((acc, { count }) => acc + parseInt(count, 10), 0);
    updateChartDescription(chartDescription, props.daysDuration);

    if (!chartInstance.value) {
      const options: ApexOptions = {
        chart: {
          type: 'area',
          height: '350px',
          toolbar: { show: false },
          background: 'transparent',
        },
        series: [{ name: 'Clicks', data: filledData }],
        xaxis: {
          type: 'datetime',
          labels: {
            rotate: -45,
            formatter,
          },
        },
        yaxis: {
          title: { text: 'Clicks' },
          stepSize: 1,
        },
        tooltip: { x: { format: 'dd MMM yyyy HH:mm' } },
        dataLabels: { enabled: false },
        grid: { show: false },
        theme: { mode: isDarkMode() ? 'dark' : 'light', palette: 'palette1' },
      };

      chartInstance.value = noSerialize(new ApexCharts(chartRef.value!, options));
      chartInstance.value!.render();
      window.addEventListener('theme-toggled', (ev) => {
        const theme = (ev as CustomEvent).detail.theme;
        chartInstance.value!.updateOptions({ theme: { mode: theme, palette: 'palette1' } });
      });
      isInitialized.value = true;
    } else {
      chartInstance.value.updateOptions({
        xaxis: { labels: { formatter } },
        series: [{ data: filledData }],
      });
    }
  });

  return (
    <>
      <div class="w-full bg-white rounded-lg shadow dark:bg-slate-800 p-4 md:p-6">
        <div class="flex justify-between">
          <div>
            <div class="flex items-center gap-1 text-gray-700 dark:text-gray-200">
              <LuBarChart class="w-8 h-8" />
              <h5 class="leading-none text-3xl font-bold">{totalClicks}</h5>
            </div>
            <p class="text-base font-normal text-gray-500 dark:text-gray-400">{`Clicks for the last ${chartDescription.value}`}</p>
          </div>
        </div>
        <div ref={chartRef} class="chart-container" />
      </div>
    </>
  );
});

const updateChartDescription = (chartDescription: Signal<string>, daysDuration: number) => {
  if (daysDuration === 1) {
    chartDescription.value = '24 hours';
  } else if (daysDuration === 7) {
    chartDescription.value = '7 days';
  } else if (daysDuration === 30) {
    chartDescription.value = '30 days';
  } else if (daysDuration === 365) {
    chartDescription.value = 'year';
  }
};

// Utility function to fetch chart data
async function fetchChartData(key: string, days: number) {
  try {
    const response = await authorizedFetch(`${process.env.CLIENTSIDE_API_DOMAIN}/api/v1/analytics/${key}/clicks?days=${days}`);
    return response.json();
  } catch (err) {
    console.error('Could not fetch clicks chart data', err);
    return [];
  }
}
