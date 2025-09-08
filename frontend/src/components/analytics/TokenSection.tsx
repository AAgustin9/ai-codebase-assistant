'use client';

import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
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
  Legend,
  ArcElement
);

// Define types for token analytics data
type TokenData = {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  tokens_by_model: Record<string, number>;
  tokens_by_day: Record<string, number>;
  average_tokens_per_request: number;
  token_efficiency: number;
};

interface TokenSectionProps {
  timeRange: string;
}

export default function TokenSection({ timeRange }: TokenSectionProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTokenData = async () => {
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

      const response = await fetch(`/api/analytics/tokens?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch token data');
        } else {
          const text = await response.text();
          throw new Error(text || 'Failed to fetch token data');
        }
      }

      const data = await response.json();
      setTokenData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching token data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [timeRange]);

  // Prepare chart data for tokens by day
  const tokensByDayData = {
    labels: tokenData?.tokens_by_day ? Object.keys(tokenData.tokens_by_day) : [],
    datasets: [
      {
        label: 'Tokens Used',
        data: tokenData?.tokens_by_day ? Object.values(tokenData.tokens_by_day) : [],
        backgroundColor: theme.chart.barPrimary,
      },
    ],
  };

  // Prepare chart data for tokens by model
  const tokensByModelData = {
    labels: tokenData?.tokens_by_model ? Object.keys(tokenData.tokens_by_model).map(key => {
      switch (key) {
        case '0': return 'GPT';
        case '1': return 'Claude';
        case '2': return 'Gemini';
        default: return key;
      }
    }) : [],
    datasets: [
      {
        label: 'Tokens by Model',
        data: tokenData?.tokens_by_model ? Object.values(tokenData.tokens_by_model) : [],
        backgroundColor: theme.chart.barPalette,
      },
    ],
  };

  // Prepare doughnut chart data for input vs output tokens
  const inputOutputData = {
    labels: ['Input Tokens', 'Output Tokens'],
    datasets: [
      {
        data: tokenData ? [tokenData.input_tokens, tokenData.output_tokens] : [0, 0],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderWidth: 2,
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
        text: 'Token Usage',
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

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#E5E7EB',
        },
      },
      title: {
        display: true,
        text: 'Input vs Output Tokens',
        color: '#E5E7EB',
      },
    },
  };

  if (loading) {
    return (
      <div className={theme.loading.container}>
        <h3 className={theme.loading.title}>Loading Token Analytics...</h3>
        <div className="flex justify-center">
          <div className={theme.loading.spinner}></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={theme.error.container}>
        <h3 className={theme.error.title}>Token Analytics Error</h3>
        <p className={theme.error.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={theme.cards.primary}>
          <h3 className={`${theme.text.subheading} mb-2`}>Total Tokens</h3>
          <p className="text-3xl font-bold">{tokenData?.total_tokens?.toLocaleString() || 0}</p>
        </div>
        <div className={theme.cards.success}>
          <h3 className={`${theme.text.subheading} mb-2`}>Input Tokens</h3>
          <p className="text-3xl font-bold">{tokenData?.input_tokens?.toLocaleString() || 0}</p>
        </div>
        <div className={theme.cards.accent}>
          <h3 className={`${theme.text.subheading} mb-2`}>Output Tokens</h3>
          <p className="text-3xl font-bold">{tokenData?.output_tokens?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className={`${theme.text.subheading} mb-2`}>Avg per Request</h3>
          <p className="text-3xl font-bold">{tokenData?.average_tokens_per_request?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Tokens by Day</h3>
          <Bar options={chartOptions} data={tokensByDayData} />
        </div>
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Tokens by Model</h3>
          <Bar options={chartOptions} data={tokensByModelData} />
        </div>
      </div>

      {/* Input vs Output Tokens */}
      <div className={theme.panel.section}>
        <h3 className={`${theme.text.subheading} mb-4`}>Token Distribution</h3>
        <div className="max-w-md mx-auto">
          <Doughnut options={doughnutOptions} data={inputOutputData} />
        </div>
      </div>

      {/* Token Efficiency */}
      {tokenData?.token_efficiency && (
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Token Efficiency</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Efficiency Score</span>
              <span className="text-2xl font-bold text-green-600">
                {Math.round(tokenData.token_efficiency * 100)}%
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${tokenData.token_efficiency * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
