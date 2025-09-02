'use client';

import { useEffect, useState } from 'react';
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

// Define types for analytics data
type AnalyticsData = {
  total_requests: number;
  requests_by_day: Record<string, number>;
  requests_by_model: Record<string, number>;
  requests_by_status: Record<string, number>;
  average_duration: number;
  recent_requests: Array<{
    id: number;
    prompt: string;
    model: string;
    status: string;
    created_at: string;
    duration_ms: number;
  }>;
};

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<string>('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date ranges
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const response = await fetch(`/api/analytics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch analytics data');
        } else {
          const text = await response.text();
          throw new Error(text || 'Failed to fetch analytics data');
        }
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

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
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded ${
              timeRange === '7d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded ${
              timeRange === '30d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded ${
              timeRange === '90d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {analyticsData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={theme.cards.primary}>
              <h3 className={`${theme.text.subheading} mb-2`}>Total Requests</h3>
              <p className="text-3xl font-bold">{analyticsData.total_requests}</p>
            </div>
            <div className={theme.cards.success}>
              <h3 className={`${theme.text.subheading} mb-2`}>Average Duration</h3>
              <p className="text-3xl font-bold">
                {analyticsData.average_duration ? `${Math.round(analyticsData.average_duration)}ms` : 'N/A'}
              </p>
            </div>
            <div className={theme.cards.accent}>
              <h3 className={`${theme.text.subheading} mb-2`}>Success Rate</h3>
              <p className="text-3xl font-bold">
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
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Prompt</th>
                    <th className="px-4 py-2 text-left">Model</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recent_requests.map(request => (
                    <tr key={request.id} className="border-t">
                      <td className="px-4 py-2">{request.id}</td>
                      <td className="px-4 py-2">{request.prompt}</td>
                      <td className="px-4 py-2">{request.model}</td>
                      <td className="px-4 py-2">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${
                            request.status === 'success' ? theme.chip.success :
                            request.status === 'error' ? theme.chip.error :
                            theme.chip.warning
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{new Date(request.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2">{request.duration_ms ? `${request.duration_ms}ms` : 'N/A'}</td>
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
