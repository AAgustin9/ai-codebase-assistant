module Api
  module V1
    class AnalyticsController < ApplicationController
      
      # GET /api/v1/analytics
      def index
        start_date = parse_date(params[:start_date], 30.days.ago)
        end_date = parse_date(params[:end_date], Time.current)
        
        analytics_data = {
          summary: get_summary(start_date, end_date),
          daily_metrics: get_daily_metrics(start_date, end_date),
          model_usage: get_model_usage(start_date, end_date),
          cost_analysis: get_cost_analysis(start_date, end_date),
          performance_metrics: get_performance_metrics(start_date, end_date)
        }
        
        render json: analytics_data, status: :ok
      end
      
      # GET /api/v1/analytics/tokens
      def tokens
        start_date = parse_date(params[:start_date], 30.days.ago)
        end_date = parse_date(params[:end_date], Time.current)
        
        token_data = {
          total_tokens: ChatAnalytics.total_tokens_by_period(start_date, end_date),
          usage_by_model: ChatAnalytics.usage_by_model(start_date, end_date),
          usage_by_day: ChatAnalytics.usage_by_day(start_date, end_date),
          average_tokens_per_request: average_tokens_per_request(start_date, end_date)
        }
        
        render json: token_data, status: :ok
      end
      
      # GET /api/v1/analytics/costs
      def costs
        start_date = parse_date(params[:start_date], 30.days.ago)
        end_date = parse_date(params[:end_date], Time.current)
        
        cost_data = {
          total_estimated_cost: ChatAnalytics.total_cost_by_period(start_date, end_date),
          cost_by_model: cost_by_model(start_date, end_date),
          cost_by_day: cost_by_day(start_date, end_date),
          average_cost_per_request: average_cost_per_request(start_date, end_date)
        }
        
        render json: cost_data, status: :ok
      end
      
      # GET /api/v1/analytics/performance
      def performance
        start_date = parse_date(params[:start_date], 30.days.ago)
        end_date = parse_date(params[:end_date], Time.current)
        
        performance_data = {
          average_response_time: ChatAnalytics.where(created_at: start_date..end_date).average(:response_time_ms),
          response_time_by_model: ChatAnalytics.average_response_time_by_model(start_date, end_date),
          response_time_by_day: response_time_by_day(start_date, end_date),
          success_rate: success_rate(start_date, end_date)
        }
        
        render json: performance_data, status: :ok
      end
      
      private
      
      def parse_date(date_string, default)
        return default if date_string.blank?
        Time.parse(date_string)
      rescue ArgumentError
        default
      end
      
      def get_summary(start_date, end_date)
        total_requests = ApiRequest.where(created_at: start_date..end_date).count
        total_analytics = ChatAnalytics.where(created_at: start_date..end_date)
        
        {
          total_requests: total_requests,
          total_tokens: total_analytics.sum(:total_tokens),
          total_estimated_cost: total_analytics.sum { |a| a.estimated_cost },
          average_response_time_ms: total_analytics.average(:response_time_ms),
          unique_models: total_analytics.distinct.pluck(:model).count,
          date_range: {
            start: start_date.iso8601,
            end: end_date.iso8601
          }
        }
      end
      
      def get_daily_metrics(start_date, end_date)
        ChatAnalytics.daily_metrics(start_date, end_date).map do |metric|
          {
            date: metric.date.strftime('%Y-%m-%d'),
            total_tokens: metric.total_tokens,
            total_prompt_tokens: metric.total_prompt_tokens,
            total_completion_tokens: metric.total_completion_tokens,
            request_count: metric.request_count,
            avg_response_time: metric.avg_response_time&.round(2)
          }
        end
      end
      
      def get_model_usage(start_date, end_date)
        ChatAnalytics.where(created_at: start_date..end_date)
          .group(:model)
          .select(
            'model',
            'SUM(total_tokens) as total_tokens',
            'SUM(prompt_tokens) as total_prompt_tokens',
            'SUM(completion_tokens) as total_completion_tokens',
            'COUNT(*) as request_count',
            'AVG(response_time_ms) as avg_response_time'
          )
          .map do |usage|
            {
              model_name: usage.model,
              total_tokens: usage.total_tokens,
              total_prompt_tokens: usage.total_prompt_tokens,
              total_completion_tokens: usage.total_completion_tokens,
              request_count: usage.request_count,
              avg_response_time: usage.avg_response_time&.round(2)
            }
          end
      end
      
      def get_cost_analysis(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        return { total_estimated_cost: 0, cost_by_model: {}, average_cost_per_request: 0 } if analytics.empty?
        
        total_cost = analytics.sum { |a| a.estimated_cost }
        
        cost_by_model = analytics.group_by(&:model).transform_values do |model_analytics|
          model_analytics.sum { |a| a.estimated_cost }
        end
        
        {
          total_estimated_cost: total_cost.round(4),
          cost_by_model: cost_by_model.transform_values { |cost| cost.round(4) },
          average_cost_per_request: (total_cost / analytics.count).round(4)
        }
      end
      
      def get_performance_metrics(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        total_requests = ApiRequest.where(created_at: start_date..end_date)
        
        {
          average_response_time_ms: analytics.average(:response_time_ms)&.round(2),
          success_rate: (total_requests.success.count.to_f / total_requests.count * 100).round(2),
          error_rate: (total_requests.error.count.to_f / total_requests.count * 100).round(2),
          requests_per_day: (total_requests.count.to_f / (end_date - start_date).to_i).round(2)
        }
      end
      
      def average_tokens_per_request(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        return 0 if analytics.empty?
        (analytics.sum(:total_tokens).to_f / analytics.count).round(2)
      end
      
      def cost_by_model(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        return {} if analytics.empty?
        
        analytics.group_by(&:model).transform_values do |model_analytics|
          model_analytics.sum { |a| a.estimated_cost }.round(4)
        end
      end
      
      def cost_by_day(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        return {} if analytics.empty?
        
        analytics.group_by { |a| a.created_at.to_date }.transform_keys { |date| date.strftime('%Y-%m-%d') }
          .transform_values { |day_analytics| day_analytics.sum { |a| a.estimated_cost }.round(4) }
      end
      
      def average_cost_per_request(start_date, end_date)
        analytics = ChatAnalytics.where(created_at: start_date..end_date)
        return 0 if analytics.empty?
        (analytics.sum { |a| a.estimated_cost } / analytics.count).round(4)
      end
      
      def response_time_by_day(start_date, end_date)
        ChatAnalytics.where(created_at: start_date..end_date)
          .group("DATE(created_at)")
          .average(:response_time_ms)
          .transform_keys { |date| date.strftime('%Y-%m-%d') }
          .transform_values { |time| time&.round(2) }
      end
      
      def success_rate(start_date, end_date)
        total_requests = ApiRequest.where(created_at: start_date..end_date)
        return 0 if total_requests.empty?
        (total_requests.success.count.to_f / total_requests.count * 100).round(2)
      end
      
    end
  end
end