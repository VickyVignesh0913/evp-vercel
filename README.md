# 🚑 Emergency Vehicle Tracker — Vercel Edition

A lighter-weight variant of the [Smart Green Corridor](../emergency-vehicle-tracker) prototype,
swapping **Google Maps** for **Leaflet + OpenStreetMap** so no API key is required
for the map itself. Designed for fast static deploys (Vercel, Netlify, GitHub Pages).

> ⚠️ **Status: prototype.** This is a UI/UX + integration demo, not a
> production emergency-response system.

**Live demo:** <https://evp-vercel.vercel.app>

---

## ✨ Features

- 📍 **Live GPS tracking** via the browser Geolocation API
- 🚨 **Start / Stop emergency mode** — toast UI (no `alert()`)
- 🏥 **Find nearest hospital** — distances computed against a configurable hospital list
- 🛣️ **Route selection** writes selected hospital to Firebase
- 🚨 **SOS button** — pulses a `traffic/sos` flag in Firebase for ~6 s
- 🍃 **Leaflet + OpenStreetMap** — no API key, no billing
- 🔥 **Firebase Realtime DB** — shared state for a control-room view

---

## 📂 Project Structure

```
.
├── index.html         # Single page — START/SOS action row, map, sections
├── style.css          # All styling
├── script.js          # App logic (initMap, startEmergency, sendSOS, …)
├── config.example.js  # Template — copy to config.js and fill in real keys
├── .gitignore         # Ignores config.js (real keys stay local)
└── README.md
```

No build step. Pure static files.

---

## ⚙️ Setup

### 1. Firebase

1. Create a project at <https://console.firebase.google.com>.
2. Enable **Realtime Database**.
3. From **Project settings → Your apps**, copy the config snippet.
4. Set database rules (development only):

   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

### 2. Configure the app

```bash
cp config.example.js config.js
# then edit config.js and paste your Firebase keys
```

`config.js` is in `.gitignore` — your real keys never leave your machine.

### 3. Run it locally

```bash
python -m http.server 8080
# or
npx serve .
```

Open <http://localhost:8080>. **Location access must be allowed** for the GPS features to work.

### 4. Deploy to Vercel

```bash
npx vercel
```

Or push to GitHub and import via the Vercel dashboard. **Don't** commit `config.js`
— either inject Firebase keys via Vercel env vars (requires a build step to inline them),
or commit a real `config.js` only on a **private** repo / Vercel team.

---

## 🔥 Firebase schema

| Path | Shape | Written by |
|---|---|---|
| `traffic/emergency` | `{ active, timestamp }` | `startEmergency()` / `stopEmergency()` |
| `traffic/location` | `{ lat, lng, speed, timestamp }` | `updateLocation()` |
| `traffic/selectedHospital` | `{ name, lat, lng, timestamp }` | `selectHospital()` |
| `traffic/sos` | `{ active, location, timestamp }` | `sendSOS()` (auto-clears after 6 s) |
| `traffic/signalStatus` | `"green"` | `selectHospital()` |

Listen from a control-room view to render all active ambulances and toggle signals.

---

## 🏥 Customising the hospital list

`script.js` ships with 3 Chennai hospitals in `hospitalDatabase`:

```js
const hospitalDatabase = [
  { name: "Apollo Hospital Chennai", lat: 13.0023, lng: 80.2388, address: "Greams Road, Chennai" },
  { name: "Saveetha Hospital", lat: 13.027023, lng: 80.016547, address: "Saveetha Medical College & Hospital, Thandalam, Chennai" },
  { name: "Sriperumbudur Government Hospital", lat: 12.967833, lng: 79.948151, address: "State Highways Rd, Near Govt Bus Stand, Sriperumbudur-602105" },
];
```

To enable **real nearby-hospital search** instead of this static list, swap `findHospitals()` to call
the [Overpass API](https://overpass-api.de/) (free, OSM-powered, no key needed):

```js
const url = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:25];
  (node["amenity"="hospital"](around:${radius},${lat},${lng}););
  out body;`;
```

---

## 🛣️ Roadmap

- Replace static `hospitalDatabase` with a live Overpass / Places query
- Listen on a companion "controller" page that shows all active ambulances on a Leaflet map
- Authenticate drivers via Firebase Auth before allowing SOS writes

---

## 👤 Author

**VickyVignesh0913**

---

## 📄 License

MIT — see `LICENSE`.