# DayFlow

DayFlow is a personal planning workspace for tasks, schedules, routines, notes, and weekly goals. It uses React, Vite, Tailwind CSS, Recharts, and browser local storage.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Data

DayFlow stores records in the current browser profile under one versioned local storage key. Use **Pengaturan → Data → Unduh cadangan** to export a JSON backup, or select a DayFlow JSON backup to restore it. Browser reminders run while the app is open and require notification permission.

The first launch starts with an empty workspace. Counts and charts reflect records entered on the device.
