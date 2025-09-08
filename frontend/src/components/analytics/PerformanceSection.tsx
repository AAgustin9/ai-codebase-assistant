'use client';

import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Define types for performance analytics data
type PerformanceData = {
  average_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  response_time_by_model: Record<string, number>;
  response_time_by_day: Record<string, number>;
  success_rate: number;
  error_rate: number;
  throughput: number;
  performance_trend: Array<{
    date: string;
    avg_response_time: number;
    success_rate: number;
  }>;
};

interface PerformanceSectionProps {
  timeRange: string;
}

export default function PerformanceSection({ timeRange }: PerformanceSectionProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPerformanceData = async () => {
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

      const response = await fetch(`/api/analytics/performance?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch performance data');
        } else {
          const text = await response.text();
          throw new Error(text || 'Failed to fetch performance data');
        }
      }

      const data = await response.json();
      setPerformanceData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  // Prepare chart data for response times by day
  const responseTimeByDayData = {
    labels: performanceData?.response_time_by_day ? Object.keys(performanceData.response_time_by_day) : [],
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: performanceData?.response_time_by_day ? Object.values(performanceData.response_time_by_day) : [],
        backgroundColor: theme.chart.barPrimary,
      },
    ],
  };

  // Prepare chart data for response times by model
  const responseTimeByModelData = {
    labels: performanceData?.response_time_by_model ? Object.keys(performanceData.response_time_by_model).map(key => {
      switch (key) {
        case '0': return 'GPT';
        case '1': return 'Claude';
        case '2': return 'Gemini';
        default: return key;
      }
    }) : [],
    datasets: [
      {
        label: 'Response Time by Model (ms)',
        data: performanceData?.response_time_by_model ? Object.values(performanceData.response_time_by_model) : [],
        backgroundColor: theme.chart.barPalette,
      },
    ],
  };

  // Prepare line chart data for performance trend
  const performanceTrendData = {
    labels: performanceData?.performance_trend ? performanceData.performance_trend.map(item => item.date) : [],
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: performanceData?.performance_trend ? performanceData.performance_trend.map(item => item.avg_response_time) : [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Success Rate (%)',
        data: performanceData?.performance_trend ? performanceData.performance_trend.map(item => item.success_rate * 100) : [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
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
        text: 'Response Time Analysis',
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
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return value + 'ms';
          }
        },
        grid: {
          color: '#374151',
        },
      }
    }
  };

  const lineChartOptions: ChartOptions<'line'> = {
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
        text: 'Performance Trend',
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
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return value + 'ms';
          }
        },
        grid: {
          color: '#374151',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        ticks: {
          color: '#9CA3AF',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false,
          color: '#374151',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={theme.loading.container}>
        <h3 className={theme.loading.title}>Loading Performance Analytics...</h3>
        <div className="flex justify-center">
          <div className={theme.loading.spinner}></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={theme.error.container}>
        <h3 className={theme.error.title}>Performance Analytics Error</h3>
        <p className={theme.error.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={theme.cards.primary}>
          <h3 className={`${theme.text.subheading} mb-2`}>Avg Response Time</h3>
          <p className="text-3xl font-bold">{Math.round(performanceData?.average_response_time || 0)}ms</p>
        </div>
        <div className={theme.cards.success}>
          <h3 className={`${theme.text.subheading} mb-2`}>P95 Response Time</h3>
          <p className="text-3xl font-bold">{Math.round(performanceData?.p95_response_time || 0)}ms</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className={`${theme.text.subheading} mb-2`}>Success Rate</h3>
          <p className="text-3xl font-bold">{Math.round((performanceData?.success_rate || 0) * 100)}%</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className={`${theme.text.subheading} mb-2`}>Throughput</h3>
          <p className="text-3xl font-bold">{performanceData?.throughput?.toFixed(2) || '0.00'} req/s</p>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Response Time Percentiles</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg">P95 Response Time</span>
              <span className="text-xl font-bold text-blue-600">
                {Math.round(performanceData?.p95_response_time || 0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg">P99 Response Time</span>
              <span className="text-xl font-bold text-orange-600">
                {Math.round(performanceData?.p99_response_time || 0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg">Average Response Time</span>
              <span className="text-xl font-bold text-green-600">
                {Math.round(performanceData?.average_response_time || 0)}ms
              </span>
            </div>
          </div>
        </div>

        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Reliability Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg">Success Rate</span>
              <span className="text-xl font-bold text-green-600">
                {Math.round((performanceData?.success_rate || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg">Error Rate</span>
              <span className="text-xl font-bold text-red-600">
                {Math.round((performanceData?.error_rate || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg">Throughput</span>
              <span className="text-xl font-bold text-blue-600">
                {performanceData?.throughput?.toFixed(2) || '0.00'} req/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Response Time by Day</h3>
          <Bar options={chartOptions} data={responseTimeByDayData} />
        </div>
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Response Time by Model</h3>
          <Bar options={chartOptions} data={responseTimeByModelData} />
        </div>
      </div>

      {/* Performance Trend */}
      {performanceData?.performance_trend && performanceData.performance_trend.length > 0 && (
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Performance Trend</h3>
          <Line options={lineChartOptions} data={performanceTrendData} />
        </div>
      )}
    </div>
  );
}
