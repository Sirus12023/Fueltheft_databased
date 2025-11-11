# Fuel Sensor Data Visualization

A React application for visualizing fuel sensor readings on an interactive map.

## Features

- Interactive map with OpenStreetMap
- Filter by sensor/bus and date range
- Visualize routes with chronological path lines
- Detailed view of sensor readings including raw data
- Basic authentication for secure access

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (optional):
Create a `.env` file in the root directory:
```
REACT_APP_AUTH_USERNAME=your_username
REACT_APP_AUTH_PASSWORD=your_password
REACT_APP_SENSOR_READINGS_URL=https://65c5ztl9veaifav1.public.blob.vercel-storage.com/sensor-readings.json
REACT_APP_SUMMARY_URL=https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json
```

Default credentials (if no .env file):
- Username: `admin@fueltheft.com`
- Password: `fueltheft123`

Default data URLs:
- Sensor readings: `https://65c5ztl9veaifav1.public.blob.vercel-storage.com/sensor-readings.json` (Vercel Blob Storage)
- Summary: `https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json` (Vercel Blob Storage)

3. **Note**: Both data files are now hosted on Vercel Blob Storage and fetched from there. You no longer need to keep these files in the `public/` directory for deployment.

4. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Deploying to Vercel

### Prerequisites
- Vercel account
- Vercel CLI (optional, for CLI deployment)

### Method 1: Deploy via Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "New Project"

4. Import your Git repository

5. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `fuel-sensor-map` (if the app is in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

6. Add Environment Variables:
   - Go to Project Settings > Environment Variables
   - Add:
     - `REACT_APP_AUTH_USERNAME` = your desired username
     - `REACT_APP_AUTH_PASSWORD` = your desired password

7. Deploy!

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Navigate to the project directory:
```bash
cd fuel-sensor-map
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy:
```bash
vercel
```

5. Set environment variables:
```bash
vercel env add REACT_APP_AUTH_USERNAME
vercel env add REACT_APP_AUTH_PASSWORD
```

6. Redeploy to apply environment variables:
```bash
vercel --prod
```

### Important Notes for Vercel Deployment

- The `vercel.json` file is already configured for optimal deployment
- **Data Files**: 
  - Both `sensor-readings.json` and `summary.json` are hosted on **Vercel Blob Storage**:
    - `https://65c5ztl9veaifav1.public.blob.vercel-storage.com/sensor-readings.json`
    - `https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json`
  - You no longer need to commit these files to your repository
- **Environment Variables**: Set these in Vercel dashboard (Project Settings > Environment Variables):
  - `REACT_APP_AUTH_USERNAME` (optional, defaults to `admin@fueltheft.com`)
  - `REACT_APP_AUTH_PASSWORD` (optional, defaults to `fueltheft123`)
  - `REACT_APP_SENSOR_READINGS_URL` (optional, defaults to Vercel Blob Storage URL)
  - `REACT_APP_SUMMARY_URL` (optional, defaults to Vercel Blob Storage URL)
- The app uses client-side authentication (credentials are checked in the browser)
- For production, use strong passwords and consider implementing server-side authentication

## Project Structure

```
fuel-sensor-map/
├── public/
│   ├── sensor-readings.json  # Sensor reading data
│   ├── summary.json          # Data summary
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.tsx         # Authentication component
│   │   ├── MapView.tsx       # Map visualization
│   │   ├── FilterPanel.tsx   # Filters for sensors and dates
│   │   └── DetailsPanel.tsx  # Reading details view
│   ├── utils/
│   │   ├── auth.ts           # Authentication utilities
│   │   └── parseData.ts      # Data parsing utilities
│   ├── types.ts              # TypeScript type definitions
│   └── App.tsx               # Main application component
├── vercel.json               # Vercel configuration
└── package.json
```

## Security Notes

- This is a basic client-side authentication system
- Credentials are stored in environment variables
- For production use, consider implementing:
  - Server-side authentication
  - JWT tokens
  - HTTPS only
  - Rate limiting
  - More robust session management

## License

Private project
