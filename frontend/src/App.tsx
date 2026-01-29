import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import RaceList from './pages/RaceList';
import RaceDetail from './pages/RaceDetail';
import Predictions from './pages/Predictions';
import Statistics from './pages/Statistics';
import Scraper from './pages/Scraper';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="races" element={<RaceList />} />
            <Route path="races/:id" element={<RaceDetail />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="scraper" element={<Scraper />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
