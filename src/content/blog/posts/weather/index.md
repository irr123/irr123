---
date: 2026-06-02T17:09:18Z
back_ref: /blog/_index.md
draft: false
title: Real-time weather forecast
description:
  "Real-time local weather forecast as a day-by-hour grid: yesterday through
  next week, plus nearby hazard alerts. Open-Meteo data, browser location, city
  search, no ads."
image: ""
---

<link rel="preconnect" href="https://api.open-meteo.com" crossorigin />
<link rel="preconnect" href="https://geocoding-api.open-meteo.com" crossorigin />

<style>
  #wx {
    display: block;
    width: 100%;
    border: 0;
    height: 1360px;
  }
  header h1 {
    min-height: 9rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @media (min-width: 720px) {
    #wx {
      width: min(100vw - 2rem, 720px);
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

Every number and colour is the raw air temperature: the standard 2 m reading,
not feels-like. One metric across the grid, the heading, and the what-to-wear
scale. Hover a cell for its hour, conditions, and clothing note.

A strip under the search box flags active hazards near the shown spot:
earthquakes, storms, floods, and wildfires, sorted by severity and distance.

Forecast and city search come from Open-Meteo[^1]. IP/GPS location,
reverse-geocoding, and the hazard feeds come from other keyless services[^2].
The URL holds the coordinates. Copy it to share a spot.

No ads. No affiliate boxes. No cookie banner. Grafana Faro handles basic runtime
telemetry; coordinates go only to the weather and hazard APIs above.

{data-content="footnotes"}

[^1]:
    Weather data and geocoding by [Open-Meteo.com](https://open-meteo.com/),
    used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This
    page transforms the API response into a local day-by-hour grid.

[^2]:
    All keyless, used as-is: IP location from
    [wtfismyip](https://wtfismyip.com/), GPS reverse-geocoding from
    [BigDataCloud](https://www.bigdatacloud.com/); hazard alerts from
    [USGS](https://earthquake.usgs.gov/) (quakes),
    [GDACS](https://www.gdacs.org/) (disasters),
    [NASA EONET](https://eonet.gsfc.nasa.gov/) (wildfires, storms), the
    [US NWS](https://www.weather.gov/) (US warnings), and
    [LibreWXR](https://librewxr.net/) (worldwide met warnings, proxying WMO and
    national services' CAP feeds). US-government and NASA data is public domain;
    GDACS is open EC/JRC data.
