import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react'

// Sentry.init({
//   dsn: "https://abd8b101f761ef1bb90ab503d92051d4@o4511457760772096.ingest.de.sentry.io/4511457800486992",
//   integrations: [
//     Sentry.feedbackIntegration({
//       // Additional SDK configuration goes in here, for example:
//       colorScheme: "system",
//     }),
//   ],
// });

posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
  defaults: '2026-01-30',
});

console.log("VITE_POSTHOG_TOKEN", import.meta.env.VITE_POSTHOG_TOKEN);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
