import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';

export const router = createBrowserRouter([
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
    element: <App />,
  },
]);
