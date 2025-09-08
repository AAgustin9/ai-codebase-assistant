'use client';

import { useState } from 'react';
import { theme } from '../theme';
import OverviewSection from './analytics/OverviewSection';
import TokenSection from './analytics/TokenSection';
import CostSection from './analytics/CostSection';
import PerformanceSection from './analytics/PerformanceSection';

type AnalyticsTab = 'overview' | 'tokens' | 'costs' | 'performance';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const tabs = [
    { id: 'overview' as AnalyticsTab, label: 'Overview', icon: '📊' },
    { id: 'tokens' as AnalyticsTab, label: 'Tokens', icon: '🔤' },
    { id: 'costs' as AnalyticsTab, label: 'Costs', icon: '💰' },
    { id: 'performance' as AnalyticsTab, label: 'Performance', icon: '⚡' },
  ];

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection timeRange={timeRange} />;
      case 'tokens':
        return <TokenSection timeRange={timeRange} />;
      case 'costs':
        return <CostSection timeRange={timeRange} />;
      case 'performance':
        return <PerformanceSection timeRange={timeRange} />;
      default:
        return <OverviewSection timeRange={timeRange} />;
    }
  };

  return (
    <div className={theme.panel.container}>
      {/* Header with time range controls */}
      <div className={theme.panel.headerBar}>
        <h2 className={theme.text.heading}>Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === '7d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === '30d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === '90d' ? theme.button.primaryActive : theme.button.neutral
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="min-h-[600px]">
        {renderActiveSection()}
      </div>
    </div>
  );
}
