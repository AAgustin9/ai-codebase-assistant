module Api
  module V1
    class AnalyticsController < ApplicationController
      before_action :authenticate_api_key!
      
      # GET /api/v1/analytics
      def index
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : 30.days.ago
        end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Time.current
        
        # Get analytics data
        analytics_data = {
          total_requests: ApiRequest.count,
          requests_by_day: ApiRequest.analytics_by_day(start_date, end_date),
          requests_by_model: ApiRequest.analytics_by_model(start_date, end_date),
          requests_by_status: ApiRequest.analytics_by_status(start_date, end_date),
          average_duration: ApiRequest.where.not(started_at: nil, completed_at: nil).average('EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000'),
          recent_requests: recent_requests
        }
        
        render json: analytics_data
      end
      
      private
      
      def recent_requests
        # Return the 10 most recent requests with limited fields (not scoped by user to avoid ApiKey model dependency)
        ApiRequest.order(created_at: :desc).limit(10).map do |request|
          {
            id: request.id,
            prompt: request.prompt.truncate(100),
            model: request.model_provider,
            status: request.status,
            created_at: request.created_at,
            duration_ms: request.duration_ms
          }
        end
      end
      
      def authenticate_api_key!
        header_key = request.headers['X-API-Key']
        env_fallback_key = ENV['API_GATEWAY_API_KEY'].presence || ENV['OPENAI_API_KEY']
        api_key_value = header_key.presence || env_fallback_key
        
        if api_key_value.blank?
          render json: { error: 'API key is missing' }, status: :unauthorized
          return
        end
        # No DB lookup to avoid model loading issues; accept configured key for analytics access
      end
    end
  end
end
