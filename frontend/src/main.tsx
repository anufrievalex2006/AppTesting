import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import App from './App.tsx';
// import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme='light'>
        <Notifications position="top-right"></Notifications>
        <App></App>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);