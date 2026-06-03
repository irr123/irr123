---
date: 2026-06-02T17:09:18Z
back_ref: /blog/_index.md
draft: false
title: Real-time local weather forecast
description:
  "Real-time local weather forecast as a day-by-hour grid -- yesterday through
  next week. Open-Meteo weather data, browser location, city search, no ads."
image: ""
keywords:
  - real-time local weather forecast
  - local weather forecast
  - hourly weather forecast
  - weather forecast grid
  - open-meteo weather forecast
  - browser location weather
  - no ads weather
---

<link rel="preconnect" href="https://wtfismyip.com" crossorigin />
<link rel="preconnect" href="https://geocoding-api.open-meteo.com" crossorigin />
<link rel="preconnect" href="https://api.open-meteo.com" crossorigin />
<link rel="preconnect" href="https://api.bigdatacloud.net" crossorigin />

<style>
  #wx {
    display: block;
    width: 100%;
    border: 0;
    /* Reserve the grid's height. The iframe defaults to ~150px, then weather.html
       sizes it to the full grid on load -- without a reserved height that jump
       shoves the article down (CLS). The grid is a fixed 24 rows x 8 days +
       legend, so its height is deterministic per width; the iframe's own JS sets
       the exact px inline and overrides this value. Tune if it drifts: load the
       page and read getElementById('wx').style.height. */
    height: 1360px;
  }
  /* On load the heading is swapped to the live one-line temperature; reserve the
     wrapped-title height and centre it so the swap doesn't shift the page. */
  header h1 {
    min-height: 9rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media (min-width: 900px) {
    #wx {
      width: min(100vw - 2rem, 1280px);
      margin-left: 50%;
      transform: translateX(-50%);
      height: 1490px;
    }
    header h1 { min-height: 11rem; }
  }
</style>

<iframe id="wx" src="/text/weather.html" title="Local hourly weather grid" allow="geolocation"></iframe>

My weather forecast as a day-by-hour grid: yesterday, today, and the next week.
I use it because normal weather sites bury the useful shape under cards, maps,
cookie banners, and forecast theater.

Every number and colour is _feels-like_ (apparent) temperature -- wind and
humidity folded in -- not the raw air reading. One metric across the grid, the
heading, and the what-to-wear scale; hover a cell for the air temp.

Weather data comes from Open-Meteo[^1]. Location starts with IP lookup, then I
can search a city or tap `◎` for browser geolocation.

No ads. No affiliate boxes. Only Grafana Faro telemetry for basic page/runtime
visibility.

{data-content="footnotes"}

[^1]:
    Weather data by [Open-Meteo.com](https://open-meteo.com/), used under
    [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This page
    transforms the API response into a local day-by-hour grid.
