'use client';

import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { theme } from '../theme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  total_requests: number;
  requests_by_day: Record<string, number>;
  requests_by_model: Record<string, number>;
  requests_by_status: Record<string, number>;
  average_duration: number | null;
  recent_requests: Array<{
    id: number;
    prompt: string;
    model: string;
    status: string;
    created_at: string;
    duration_ms: number | null;
  }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState<boolean>(false);

  // Fetch analytics data function - only called manually
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching analytics data...');
      const response = await fetch('http://localhost:3003/api/v1/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || `HTTP ${response.status}: Failed to fetch analytics data`);
        } else {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text || 'Failed to fetch analytics data'}`);
        }
      }

      const data = await response.json();
      console.log('Analytics data received:', data);
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data only once when component mounts
  useEffect(() => {
    if (!hasInitialLoad) {
      console.log('Component mounted, fetching analytics...');
      setHasInitialLoad(true);
      fetchAnalytics();
    }
  }, []); // Empty dependency array - runs only once on mount


  // Prepare chart data for requests by day
  const requestsByDayData = {
    labels: analyticsData ? Object.keys(analyticsData.requests_by_day) : [],
    datasets: [
      {
        label: 'Requests',
        data: analyticsData ? Object.values(analyticsData.requests_by_day) : [],
        backgroundColor: theme.chart.barPrimary,
      },
    ],
  };

  // Prepare chart data for requests by model
  const requestsByModelData = {
    labels: analyticsData ? Object.keys(analyticsData.requests_by_model).map(key => {
      switch (key) {
        case '0': return 'GPT';
        case '1': return 'Claude';
        case '2': return 'Gemini';
        default: return key;
      }
    }) : [],
    datasets: [
      {
        label: 'Requests by Model',
        data: analyticsData ? Object.values(analyticsData.requests_by_model) : [],
        backgroundColor: theme.chart.barPalette,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'API Requests',
      },
    },
  };

  if (loading) {
    return (
      <div className={theme.loading.container}>
        <h2 className={theme.loading.title}>Loading Analytics...</h2>
        <div className="flex justify-center">
          <div className={theme.loading.spinner}></div>
        </div>
        <p className={theme.loading.note}>Fetching insights, please wait...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={theme.error.container}>
        <h2 className={theme.error.title}>Error</h2>
        <p className={theme.error.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className={theme.panel.container}>
      <div className={theme.panel.headerBar}>
        <h2 className={theme.text.heading}>Analytics Dashboard</h2>
        <div className="flex space-x-2 items-center">
          <span className="px-3 py-1 rounded bg-gray-200 text-black text-sm">
            Last 30 Days
          </span>
          <button
            onClick={() => {
              console.log('Refresh button clicked');
              fetchAnalytics();
            }}
            disabled={loading}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              loading 
                ? 'bg-gray-300 text-black cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {analyticsData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={theme.cards.primary}>
              <h3 className={`${theme.text.subheading} mb-2`}>Total Requests</h3>
              <p className="text-3xl font-bold text-black">{analyticsData.total_requests}</p>
            </div>
            <div className={theme.cards.success}>
              <h3 className={`${theme.text.subheading} mb-2`}>Average Duration</h3>
              <p className="text-3xl font-bold text-black">
                {analyticsData.average_duration ? `${Math.round(analyticsData.average_duration)}ms` : 'N/A'}
              </p>
            </div>
            <div className={theme.cards.accent}>
              <h3 className={`${theme.text.subheading} mb-2`}>Success Rate</h3>
              <p className="text-3xl font-bold text-black">
                {analyticsData.requests_by_status && 
                 analyticsData.total_requests > 0 ? 
                  `${Math.round((analyticsData.requests_by_status['1'] || 0) / analyticsData.total_requests * 100)}%` : 
                  '0%'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className={theme.panel.section}>
              <h3 className={`${theme.text.subheading} mb-4`}>Requests by Day</h3>
              <Bar options={chartOptions} data={requestsByDayData} />
            </div>
            <div className={theme.panel.section}>
              <h3 className={`${theme.text.subheading} mb-4`}>Requests by Model</h3>
              <Bar options={chartOptions} data={requestsByModelData} />
            </div>
          </div>

          <div className={theme.panel.section}>
            <h3 className={`${theme.text.subheading} mb-4`}>Recent Requests</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-black">ID</th>
                    <th className="px-4 py-2 text-left text-black">Prompt</th>
                    <th className="px-4 py-2 text-left text-black">Model</th>
                    <th className="px-4 py-2 text-left text-black">Status</th>
                    <th className="px-4 py-2 text-left text-black">Time</th>
                    <th className="px-4 py-2 text-left text-black">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recent_requests.map(request => (
                    <tr key={request.id} className="border-t">
                      <td className="px-4 py-2 text-black">{request.id}</td>
                      <td className="px-4 py-2 text-black">{request.prompt}</td>
                      <td className="px-4 py-2 text-black">
                        {request.model === '0' ? 'GPT' : 
                         request.model === '1' ? 'Claude' : 
                         request.model === '2' ? 'Gemini' : request.model}
                      </td>
                      <td className="px-4 py-2">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${
                            request.status === '1' || request.status === 'success' ? theme.chip.success :
                            request.status === '2' || request.status === 'error' ? theme.chip.error :
                            theme.chip.warning
                          }`}
                        >
                          {request.status === '0' ? 'Pending' :
                           request.status === '1' ? 'Success' :
                           request.status === '2' ? 'Error' : request.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-black">{new Date(request.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-black">{request.duration_ms ? `${request.duration_ms}ms` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className={theme.empty.container}>
          <p className={theme.empty.text}>No analytics data available</p>
        </div>
      )}
    </div>
  );
}
