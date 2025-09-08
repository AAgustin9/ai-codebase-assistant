module Api
  module V1
    class ChatController < ApplicationController
      before_action :authenticate_api_key!
      
      # POST /api/v1/chat
      def create
        Rails.logger.info "[API-GATEWAY] Received chat request"
        Rails.logger.info "[API-GATEWAY] Request params: #{chat_params.to_json}"
        
        api_request = create_api_request
        
        begin
          # Set start time for tracking request duration
          api_request.update(started_at: Time.current)
          Rails.logger.info "[API-GATEWAY] Request started at #{Time.current}"
          
          # Forward the request to the AI Engine
          Rails.logger.info "[API-GATEWAY] Forwarding request to AI Engine"
          response = forward_to_ai_engine(chat_params)
          Rails.logger.info "[API-GATEWAY] Received response from AI Engine"
          
          # Record success and response data
          api_request.update(
            status: :success,
            completed_at: Time.current,
            response_data: response
          )
          
          # Create analytics record if usage data is available
          create_chat_analytics(api_request, response) if response['usage']
          
          Rails.logger.info "[API-GATEWAY] Request completed successfully in #{Time.current - api_request.started_at} seconds"
          render json: response, status: :ok
        rescue => e
          # Record error
          Rails.logger.error "[API-GATEWAY] Error processing request: #{e.message}"
          Rails.logger.error "[API-GATEWAY] Backtrace: #{e.backtrace.join("\n")}"
          
          api_request.update(
            status: :error,
            error_message: e.message,
            completed_at: Time.current
          )
          
          render json: { error: e.message }, status: :internal_server_error
        end
      end
      
      private
      
      def chat_params
        # Handle both direct parameters and nested chat parameters
        if params[:chat].present?
          params.require(:chat).permit(:prompt, :model, tools: [], options: {})
        else
          params.permit(:prompt, :model, tools: [], options: {})
        end
      end
      
      def create_api_request
        # Map model names to enum values
        model_provider = case chat_params[:model]&.downcase
        when /gpt/
          'gpt'
        when /claude/
          'claude'
        when /gemini/
          'gemini'
        else
          'gpt' # default
        end
        
        @current_api_key.api_requests.create!(
          prompt: chat_params[:prompt],
          model_provider: model_provider,
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          status: :pending
        )
      end
      
      def forward_to_ai_engine(params)
        require 'net/http'
        require 'uri'
        require 'json'
        
        ai_engine_base = ENV.fetch('AI_ENGINE_URL', 'http://localhost:3001/api/v1')
        use_tools = ActiveModel::Type::Boolean.new.cast(params.dig(:options, :use_tools))
        endpoint  = use_tools ? '/ai/generate-with-tools' : '/ai/generate'
        full_url  = "#{ai_engine_base}#{endpoint}"
      
        Rails.logger.info "[API-GATEWAY] -> AI: #{full_url}"
      
        uri = URI(full_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.read_timeout = 25
        http.open_timeout = 5
        http.write_timeout = 10
      
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request['Accept'] = 'application/json'
        request['X-Request-Id'] = request.request_id if request.respond_to?(:request_id)
        request['X-Forwarded-For'] = request.remote_ip if request.respond_to?(:remote_ip)
        request['X-Internal-Token'] = ENV['AI_ENGINE_INTERNAL_TOKEN'] if ENV['AI_ENGINE_INTERNAL_TOKEN']
      
        payload = {
          prompt:  params[:prompt],
          options: {
            model: params[:model],
            **(params[:options] || {}).to_h
          }
        }
      
        request.body = payload.to_json
      
        begin
          started = Time.current
          response = http.request(request)
          dur = Time.current - started
      
          Rails.logger.info "[API-GATEWAY] <- AI status=#{response.code} in #{dur.round(2)}s"
      
          if response.code.to_i.between?(200, 299)
            JSON.parse(response.body)
          else
            Rails.logger.error "[API-GATEWAY] AI Engine error: #{response.code} - #{response.body}"
            raise "AI Engine returned error: #{response.code} - #{response.body}"
          end
        rescue => e
          Rails.logger.error "[API-GATEWAY] forward_to_ai_engine failed: #{e.message}"
          raise
        end
      end
      
      def create_chat_analytics(api_request, response)
        usage = response['usage']
        return unless usage
        
        # Extract tools used from response
        tools_used = []
        if response['toolResults']&.any?
          tools_used = response['toolResults'].map { |tool| tool['name'] }.compact.uniq
        end
        
        # Get model name from request or response
        model_name = chat_params[:model] || response.dig('meta', 'model') || 'unknown'
        
        # Calculate response time
        response_time_ms = api_request.duration_ms || 0
        
        api_request.create_chat_analytics!(
          prompt_tokens: usage['inputTokens'] || 0,
          completion_tokens: usage['outputTokens'] || 0,
          total_tokens: usage['totalTokens'] || 0,
          model: model_name,
          response_time_ms: response_time_ms,
          tools_used: tools_used,
          error_message: nil
        )
        
        Rails.logger.info "[API-GATEWAY] Created analytics record - Model: #{model_name}, Tokens: #{usage['totalTokens']}, Tools: #{tools_used.join(', ')}"
      rescue => e
        Rails.logger.error "[API-GATEWAY] Failed to create analytics record: #{e.message}"
        # Don't fail the request if analytics creation fails
      end
      
      def authenticate_api_key!
        header_key = request.headers['X-API-Key']
        env_fallback_key = ENV['OPENAI_API_KEY']
        api_key_value = header_key.presence || env_fallback_key
        Rails.logger.info "[API-GATEWAY] Authenticating request with API key (header present? #{header_key.present?}, env fallback? #{env_fallback_key.present?})"
        
        if api_key_value.blank?
          Rails.logger.warn "[API-GATEWAY] Authentication failed: API key is missing (no header, no env OPENAI_API_KEY)"
          render json: { error: 'API key is missing' }, status: :unauthorized
          return
        end
        
        # Mask the API key for logging (show only first 4 and last 4 characters)
        masked_key = api_key_value.length > 8 ? "#{api_key_value[0..3]}...#{api_key_value[-4..-1]}" : "****"
        Rails.logger.info "[API-GATEWAY] Checking API key: #{masked_key}"
        
        @current_api_key = ApiKey.find_by(key: api_key_value, status: :active)
        
        if @current_api_key.nil?
          Rails.logger.warn "[API-GATEWAY] Authentication failed: Invalid or revoked API key"
          render json: { error: 'Invalid or revoked API key' }, status: :unauthorized
        else
          Rails.logger.info "[API-GATEWAY] Authentication successful for API key: #{masked_key}"
        end
      end
    end
  end
end
