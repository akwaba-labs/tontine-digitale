import { RouterProvider } from 'react-router';
import AppProviders from './AppProviders';
import { router } from './router';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
