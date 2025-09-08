# Chat Analytics Implementation

This document describes the analytics implementation for tracking token usage and metrics in the chat API.

## Overview

The system now tracks detailed analytics for every chat request, including:
- Token usage (input, output, total)
- Model information
- Response times
- Tools used
- Cost estimates
- Error tracking

## Database Schema

### ChatAnalytics Table

```sql
CREATE TABLE chat_analytics (
  id BIGSERIAL PRIMARY KEY,
  api_request_id BIGINT NOT NULL REFERENCES api_requests(id),
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  model_name VARCHAR NOT NULL,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  tools_used JSON DEFAULT '[]',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## API Endpoints

### Analytics Endpoints

1. **GET /api/v1/analytics** - Complete analytics overview
   - Query parameters: `start_date`, `end_date`
   - Returns: Summary, daily metrics, model usage, cost analysis, performance metrics

2. **GET /api/v1/analytics/tokens** - Token usage analytics
   - Query parameters: `start_date`, `end_date`
   - Returns: Total tokens, usage by model, usage by day, average tokens per request

3. **GET /api/v1/analytics/costs** - Cost analysis
   - Query parameters: `start_date`, `end_date`
   - Returns: Total estimated cost, cost by model, cost by day, average cost per request

4. **GET /api/v1/analytics/performance** - Performance metrics
   - Query parameters: `start_date`, `end_date`
   - Returns: Average response time, response time by model, success rate

## Model Pricing

The system includes estimated cost calculations based on current model pricing:

- **GPT-4o**: $0.005/1K input tokens, $0.015/1K output tokens
- **GPT-4**: $0.03/1K input tokens, $0.06/1K output tokens
- **GPT-3.5-turbo**: $0.0015/1K input tokens, $0.002/1K output tokens
- **Claude-3.5-Sonnet**: $0.003/1K input tokens, $0.015/1K output tokens
- **Claude-3-Opus**: $0.015/1K input tokens, $0.075/1K output tokens

## Usage Examples

### Get Complete Analytics
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/v1/analytics?start_date=2024-11-01&end_date=2024-12-01"
```

### Get Token Usage
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/v1/analytics/tokens?start_date=2024-11-01&end_date=2024-12-01"
```

### Get Cost Analysis
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3000/api/v1/analytics/costs?start_date=2024-11-01&end_date=2024-12-01"
```

## Response Format

### Analytics Overview Response
```json
{
  "summary": {
    "total_requests": 150,
    "total_tokens": 45000,
    "total_estimated_cost": 0.125,
    "average_response_time_ms": 1250.5,
    "unique_models": 3,
    "date_range": {
      "start": "2024-11-01T00:00:00Z",
      "end": "2024-12-01T00:00:00Z"
    }
  },
  "daily_metrics": [
    {
      "date": "2024-11-01",
      "total_tokens": 1500,
      "total_prompt_tokens": 800,
      "total_completion_tokens": 700,
      "request_count": 5,
      "avg_response_time": 1200.5
    }
  ],
  "model_usage": [
    {
      "model_name": "gpt-4o",
      "total_tokens": 30000,
      "total_prompt_tokens": 15000,
      "total_completion_tokens": 15000,
      "request_count": 100,
      "avg_response_time": 1100.2
    }
  ],
  "cost_analysis": {
    "total_estimated_cost": 0.125,
    "cost_by_model": {
      "gpt-4o": 0.075,
      "gpt-3.5-turbo": 0.050
    }
  },
  "performance_metrics": {
    "average_response_time_ms": 1250.5,
    "success_rate": 98.5,
    "error_rate": 1.5,
    "requests_per_day": 5.0
  }
}
```

## Implementation Details

### AI Engine Changes
- Modified `AiService` to return token usage information
- Updated response format to include `usage`, `finishReason`, and `duration`
- Enhanced logging to track token usage

### API Gateway Changes
- Created `ChatAnalytics` model with cost estimation methods
- Modified `ChatController` to capture and store analytics data
- Created `AnalyticsController` with multiple endpoints for different analytics views
- Added database migration for analytics table

### Error Handling
- Analytics creation failures don't affect the main chat request
- Comprehensive error logging for debugging
- Graceful fallbacks for missing data

## Database Migration

To apply the analytics schema:

```bash
cd api-gateway
rails db:migrate
```

## Authentication

All analytics endpoints require API key authentication using the `X-API-Key` header, same as the chat endpoints.

## Future Enhancements

- Real-time analytics dashboard
- Alerting for unusual usage patterns
- Export functionality for analytics data
- More detailed cost tracking per user/organization
- Integration with external analytics tools
