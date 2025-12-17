import { createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import App from '../App';

const isDev = import.meta.env.MODE === 'development';

export const Route = createRootRoute({
  component: () => (
    <>
      <App />
      {isDev && <TanStackRouterDevtools />}
    </>
  ),
});

