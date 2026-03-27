# WMS Frontend

Frontend boilerplate for `wms-backend` with:

- React + Vite
- Redux Toolkit + React Redux
- React Router DOM v6
- Axios API client
- Firebase setup
- Tailwind CSS v4
- shadcn/ui base setup

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment

Update values in `.env`:

- `VITE_API_BASE_URL` (default: `http://localhost:3000/api/v1`)
- Firebase keys (`VITE_FIREBASE_*`)

## Folder Structure

```text
src/
  components/
    ui/              # shadcn ui components
  config/            # runtime env config
  features/          # redux slices by feature
  layouts/           # route layouts
  pages/             # page-level screens
  router/            # react-router routes
  services/
    api/             # axios clients and api calls
    firebase/        # firebase initialization
  store/             # redux store setup
  lib/               # utilities (cn, helpers)
```

## Notes

- Alias `@` points to `src`.
- `axiosClient` is in `src/services/api/axiosClient.js`.
- `firebaseApp` is in `src/services/firebase/firebase.js`.
- Example Redux flow is in `src/features/counter`.
