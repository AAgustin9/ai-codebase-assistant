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
import { theme } from '../../theme';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define types for overview analytics data
type OverviewData = {
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

interface OverviewSectionProps {
  timeRange: string;
}

export default function OverviewSection({ timeRange }: OverviewSectionProps) {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOverviewData = async () => {
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
          throw new Error(err.error || 'Failed to fetch overview data');
        } else {
          const text = await response.text();
          throw new Error(text || 'Failed to fetch overview data');
        }
      }

      const data = await response.json();
      setOverviewData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [timeRange]);

  // Prepare chart data for requests by day
  const requestsByDayData = {
    labels: overviewData?.requests_by_day ? Object.keys(overviewData.requests_by_day) : [],
    datasets: [
      {
        label: 'Requests',
        data: overviewData?.requests_by_day ? Object.values(overviewData.requests_by_day) : [],
        backgroundColor: theme.chart.barPrimary,
      },
    ],
  };

  // Prepare chart data for requests by model
  const requestsByModelData = {
    labels: overviewData?.requests_by_model ? Object.keys(overviewData.requests_by_model).map(key => {
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
        data: overviewData?.requests_by_model ? Object.values(overviewData.requests_by_model) : [],
        backgroundColor: theme.chart.barPalette,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
        },
      },
      title: {
        display: true,
        text: 'API Requests',
        color: '#E5E7EB',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        ticks: {
          color: '#9CA3AF',
        },
        grid: {
          color: '#374151',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={theme.loading.container}>
        <h3 className={theme.loading.title}>Loading Overview...</h3>
        <div className="flex justify-center">
          <div className={theme.loading.spinner}></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={theme.error.container}>
        <h3 className={theme.error.title}>Overview Error</h3>
        <p className={theme.error.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={theme.cards.primary}>
          <h3 className={`${theme.text.subheading} mb-2`}>Total Requests</h3>
          <p className="text-3xl font-bold">{overviewData?.total_requests || 0}</p>
        </div>
        <div className={theme.cards.success}>
          <h3 className={`${theme.text.subheading} mb-2`}>Average Duration</h3>
          <p className="text-3xl font-bold">
            {overviewData?.average_duration ? `${Math.round(overviewData.average_duration)}ms` : 'N/A'}
          </p>
        </div>
        <div className={theme.cards.accent}>
          <h3 className={`${theme.text.subheading} mb-2`}>Success Rate</h3>
          <p className="text-3xl font-bold">
            {overviewData?.requests_by_status && 
             overviewData?.total_requests && overviewData.total_requests > 0 ? 
              `${Math.round((overviewData.requests_by_status['1'] || 0) / overviewData.total_requests * 100)}%` : 
              '0%'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Requests by Day</h3>
          <Bar options={chartOptions} data={requestsByDayData} />
        </div>
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Requests by Model</h3>
          <Bar options={chartOptions} data={requestsByModelData} />
        </div>
      </div>

      {/* Recent Requests Table */}
      {overviewData?.recent_requests && overviewData.recent_requests.length > 0 && (
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Recent Requests</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">ID</th>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">Prompt</th>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">Model</th>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">Time</th>
                  <th className="px-4 py-2 text-left text-gray-200 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.recent_requests.map(request => (
                  <tr key={request.id} className="border-t border-gray-600 hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-2 text-gray-300">{request.id}</td>
                    <td className="px-4 py-2 text-gray-300 truncate max-w-xs">{request.prompt}</td>
                    <td className="px-4 py-2 text-gray-300">{request.model}</td>
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
                    <td className="px-4 py-2 text-gray-300">{new Date(request.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-300">{request.duration_ms ? `${request.duration_ms}ms` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
