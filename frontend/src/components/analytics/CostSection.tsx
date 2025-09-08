'use client';

import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
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

// Define types for cost analytics data
type CostData = {
  total_cost: number;
  cost_by_model: Record<string, number>;
  cost_by_day: Record<string, number>;
  average_cost_per_request: number;
  cost_breakdown: {
    input_cost: number;
    output_cost: number;
    processing_cost: number;
  };
  cost_trend: Array<{
    date: string;
    cost: number;
  }>;
};

interface CostSectionProps {
  timeRange: string;
}

export default function CostSection({ timeRange }: CostSectionProps) {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCostData = async () => {
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

      const response = await fetch(`/api/analytics/costs?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch cost data');
        } else {
          const text = await response.text();
          throw new Error(text || 'Failed to fetch cost data');
        }
      }

      const data = await response.json();
      setCostData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching cost data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, [timeRange]);

  // Prepare chart data for costs by day
  const costsByDayData = {
    labels: costData?.cost_by_day ? Object.keys(costData.cost_by_day) : [],
    datasets: [
      {
        label: 'Daily Cost ($)',
        data: costData?.cost_by_day ? Object.values(costData.cost_by_day) : [],
        backgroundColor: theme.chart.barPrimary,
      },
    ],
  };

  // Prepare chart data for costs by model
  const costsByModelData = {
    labels: costData?.cost_by_model ? Object.keys(costData.cost_by_model).map(key => {
      switch (key) {
        case '0': return 'GPT';
        case '1': return 'Claude';
        case '2': return 'Gemini';
        default: return key;
      }
    }) : [],
    datasets: [
      {
        label: 'Cost by Model ($)',
        data: costData?.cost_by_model ? Object.values(costData.cost_by_model) : [],
        backgroundColor: theme.chart.barPalette,
      },
    ],
  };

  // Prepare line chart data for cost trend
  const costTrendData = {
    labels: costData?.cost_trend ? costData.cost_trend.map(item => item.date) : [],
    datasets: [
      {
        label: 'Cost Trend ($)',
        data: costData?.cost_trend ? costData.cost_trend.map(item => item.cost) : [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
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
        text: 'Cost Analysis',
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
            return '$' + value.toFixed(4);
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
        text: 'Cost Trend Over Time',
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
            return '$' + value.toFixed(4);
          }
        },
        grid: {
          color: '#374151',
        },
      }
    }
  };

  if (loading) {
    return (
      <div className={theme.loading.container}>
        <h3 className={theme.loading.title}>Loading Cost Analytics...</h3>
        <div className="flex justify-center">
          <div className={theme.loading.spinner}></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={theme.error.container}>
        <h3 className={theme.error.title}>Cost Analytics Error</h3>
        <p className={theme.error.text}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={theme.cards.primary}>
          <h3 className={`${theme.text.subheading} mb-2`}>Total Cost</h3>
          <p className="text-3xl font-bold">${costData?.total_cost?.toFixed(4) || '0.0000'}</p>
        </div>
        <div className={theme.cards.success}>
          <h3 className={`${theme.text.subheading} mb-2`}>Avg per Request</h3>
          <p className="text-3xl font-bold">${costData?.average_cost_per_request?.toFixed(6) || '0.000000'}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className={`${theme.text.subheading} mb-2`}>Input Cost</h3>
          <p className="text-3xl font-bold">${costData?.cost_breakdown?.input_cost?.toFixed(4) || '0.0000'}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className={`${theme.text.subheading} mb-2`}>Output Cost</h3>
          <p className="text-3xl font-bold">${costData?.cost_breakdown?.output_cost?.toFixed(4) || '0.0000'}</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      {costData?.cost_breakdown && (
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Cost Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Input Processing</h4>
              <p className="text-2xl font-bold text-blue-600">
                ${costData.cost_breakdown.input_cost?.toFixed(4) || '0.0000'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Output Generation</h4>
              <p className="text-2xl font-bold text-green-600">
                ${costData.cost_breakdown.output_cost?.toFixed(4) || '0.0000'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Processing</h4>
              <p className="text-2xl font-bold text-purple-600">
                ${costData.cost_breakdown.processing_cost?.toFixed(4) || '0.0000'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Costs by Day</h3>
          <Bar options={chartOptions} data={costsByDayData} />
        </div>
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Costs by Model</h3>
          <Bar options={chartOptions} data={costsByModelData} />
        </div>
      </div>

      {/* Cost Trend */}
      {costData?.cost_trend && costData.cost_trend.length > 0 && (
        <div className={theme.panel.section}>
          <h3 className={`${theme.text.subheading} mb-4`}>Cost Trend</h3>
          <Line options={lineChartOptions} data={costTrendData} />
        </div>
      )}
    </div>
  );
}
