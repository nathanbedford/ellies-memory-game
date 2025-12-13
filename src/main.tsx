import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PostHogProvider } from 'posthog-js/react'

const posthogKey = "phc_LMb2gHTzOA8grLHOZJFsGvfiX2Adcb41Nqbux1EW0yH";
const posthogHost = "https://us.i.posthog.com";
const isLocalDev = import.meta.env.MODE === 'development';

createRoot(document.getElementById('root')!).render(
  <>
    {isLocalDev ? (
      <App />
    ) : (
      <PostHogProvider
        apiKey={posthogKey}
        options={{
          api_host: posthogHost,
          defaults: '2025-05-24',
          capture_exceptions: true,
        }}
      >
        <App />
      </PostHogProvider>
    )}
  </>
)
