import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';
import { GlossaryRoute } from './routes/GlossaryRoute';

// Match the router to Vite's base path so internal links and history routing
// work under a GitHub Pages subpath. BASE_URL is '/' at root, '/<repo>/' on Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
    },
    {
      path: '/book/:bookSlug',
      element: <App />,
    },
    {
      path: '/book/:bookSlug/page/:pageId',
      element: <App />,
    },
    {
      path: '/book/:bookSlug/scenario/:scenarioId',
      element: <App />,
    },
    {
      path: '/book/:bookSlug/legal/:legalRefId',
      element: <App />,
    },
    {
      path: '/book/:bookSlug/glossary',
      element: <GlossaryRoute />,
    },
  ],
  { basename },
);
