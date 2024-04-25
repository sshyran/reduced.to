import { DocumentHead, routeLoader$ } from '@builder.io/qwik-city';
import { serverSideFetch } from '../../../../shared/auth.service';
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { ClicksChart } from '../../../../components/dashboard/analytics/clicks-chart/clicks-chart';
import { GeoChart } from '../../../../components/dashboard/analytics/geo-chart/geo-chart';

export const useGetClicks = routeLoader$(async ({ params: { key }, cookie, redirect }) => {
  const res = await serverSideFetch(`${process.env.API_DOMAIN}/api/v1/analytics/${key}/clicks?days=7`, cookie);

  if (res.status !== 200) {
    throw redirect(302, '/unknown');
  }

  const data = await res.json();
  return {
    key,
    data,
  };
});

export const useGetData = routeLoader$(async ({ params: { key }, cookie, redirect }) => {
  const res = await serverSideFetch(`${process.env.API_DOMAIN}/api/v1/analytics/${key}/data?days=7`, cookie);

  if (res.status !== 200) {
    throw redirect(302, '/unknown');
  }

  const data = await res.json();
  return {
    data,
  };
});

export default component$(() => {
  const daysDuration = useSignal(7);
  const clicks = useGetClicks();
  const data = useGetData();

  useVisibleTask$(() => {
    console.log(clicks.value);
    console.log(data.value);
  });

  return (
    <>
      <div class="flex justify-between items-start mb-4">
        <div class="text-left w-3/4">
          <h1 class="text-xl font-semibold">Analytics Dashboard</h1>
          <p class="sm:block hidden">
            Track click-through rates, geographic locations, referral sources, and more for your short links. Data shown here are presented
            in Coordinated Universal Time (UTC).
          </p>
        </div>
        <div class="flex my-auto">
          <select
            class="select select-bordered max-w-xs"
            value={daysDuration.value}
            onChange$={(event) => {
              daysDuration.value = parseInt((event.target as HTMLSelectElement).value, 10);
            }}
          >
            <option value={1}>Last 24 hours</option>
            <option selected value={7}>
              Last 7 days
            </option>
            <option value={30}>Last 30 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <ClicksChart
          urlKey={clicks.value.key}
          daysDuration={daysDuration.value}
          initialData={clicks.value.data.clicksOverTime}
          url={clicks.value.data.url}
        />
        <GeoChart
          urlKey={clicks.value.key}
          daysDuration={daysDuration.value}
          initialData={data.value.data}
          url={data.value.data.url}
        />
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: 'Reduced.to | Analytics',
  meta: [
    {
      name: 'title',
      content: 'Reduced.to | Dashboard - Analytics',
    },
    {
      name: 'description',
      content: 'Reduced.to | Analytics page. See live analytics of your links!',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://reduced.to/dashboard/analytics',
    },
    {
      property: 'og:title',
      content: 'Reduced.to | Dashboard - Analytics',
    },
    {
      property: 'og:description',
      content: 'Reduced.to | Analytics page. See live analytics of your links!',
    },
    {
      property: 'twitter:card',
      content: 'summary',
    },
    {
      property: 'twitter:title',
      content: 'Reduced.to | Dashboard - Analytics',
    },
    {
      property: 'twitter:description',
      content: 'Reduced.to | Analytics page. See live analytics of your links!',
    },
  ],
};
