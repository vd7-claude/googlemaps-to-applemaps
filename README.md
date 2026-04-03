<div align="center">
 
<img src="https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/google/google-maps.webp" alt="Google Maps" width="80" height="80" />
<img src="https://raw.githubusercontent.com/vdutts7/squircle/refs/heads/main/webp/macos/apple-maps.webp" alt="Apple Maps" width="80" height="80" />

<h1 align="center">googlemaps-to-applemaps</h1>
<p align="center"><i><b>Drop Google Maps link → get Apple Maps link</b></i></p>

</div>

<br/>

## ToC

<ol>
    <a href="#about">About</a><br/>
    <a href="#how-to-build">How to build</a><br/>
    <a href="#next-steps">Next steps</a><br/>
    <a href="#tools-used">Tools used</a><br/>
    <a href="#contact">Contact</a>
</ol>

<br/>

## About

Converts any Google Maps URL format into its Apple Maps equivalent — places, coordinates, directions, short links, and more. Runs entirely client-side, no API keys, no data sent anywhere.

**Supported URL formats:**
- `/maps/place/Name/@lat,lng,zoom` (with `!3d`/`!4d` high-precision coords)
- `/maps/@lat,lng,zoom` (coordinate view)
- `/maps/dir/From/To` (directions)
- `/maps/search/Query` (search)
- `?q=lat,lng` or `?q=place` (query params)
- `maps.app.goo.gl/xxx` (short links — detected with guidance to expand)

**Features:**
- Arc-style bottom dock input with auto-convert on paste
- 3D MapLibre preview with dark/satellite toggle
- Skeleton loading, haptic feedback, glassmorphic UI
- PWA — installable, works offline, caches map tiles

<br/>

## How to build

```bash
git clone https://github.com/vd7-claude/googlemaps-to-applemaps.git
cd googlemaps-to-applemaps
npm install
npm run dev
```

<br/>

## Next steps

- [ ] Resolve `maps.app.goo.gl` short links via server proxy
- [ ] Add share sheet integration on mobile
- [ ] Support Google Maps embed URLs
- [ ] Reverse mode: Apple Maps → Google Maps

<br/>

## Tools used

[![React][react-badge]][react-url]
[![Vite][vite-badge]][vite-url]
[![MapLibre][maplibre-badge]][maplibre-url]

<br/>

## Contact

<a href="https://vd7.io"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910810/readme-badges/readme-badge-vd7.png" alt="vd7.io" height="40" /></a> &nbsp; <a href="https://x.com/vdutts7"><img src="https://res.cloudinary.com/ddyc1es5v/image/upload/v1773910817/readme-badges/readme-badge-x.png" alt="/vdutts7" height="40" /></a>

<!-- BADGES -->
[react-badge]: https://img.shields.io/badge/React_19-000000?style=for-the-badge&logo=react
[react-url]: https://react.dev
[vite-badge]: https://img.shields.io/badge/Vite_8-000000?style=for-the-badge&logo=vite
[vite-url]: https://vite.dev
[maplibre-badge]: https://img.shields.io/badge/MapLibre_GL-000000?style=for-the-badge
[maplibre-url]: https://maplibre.org
