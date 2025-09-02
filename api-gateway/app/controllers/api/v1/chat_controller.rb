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
        params.permit(:prompt, :model, tools: [], options: {})
      end
      
      def create_api_request
        @current_api_key.api_requests.create!(
          prompt: chat_params[:prompt],
          model_provider: chat_params[:model] || 'gpt',
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          status: :pending
        )
      end
      
      def forward_to_ai_engine(params)
        # Get the AI engine base URL (include API prefix by default)
        ai_engine_url = ENV.fetch('AI_ENGINE_URL', 'http://localhost:3001/api/v1')
        endpoint = params[:tools].present? ? '/ai/generate-with-tools' : '/ai/generate'
        
        full_url = "#{ai_engine_url}#{endpoint}"
        Rails.logger.info "[API-GATEWAY] Making request to AI Engine: #{full_url}"
        Rails.logger.info "[API-GATEWAY] Request params: model=#{params[:model]}, prompt_length=#{params[:prompt]&.length}"
        
        request_start_time = Time.current
        
        # Make request to AI Engine
        response = HTTP.post(full_url, json: {
          prompt: params[:prompt],
          options: {
            model: params[:model],
            **params[:options].to_h
          },
          tools: params[:tools]
        })
        
        request_duration = Time.current - request_start_time
        Rails.logger.info "[API-GATEWAY] AI Engine response received in #{request_duration} seconds"
        Rails.logger.info "[API-GATEWAY] AI Engine response status: #{response.status}"
        
        # Parse and return response
        begin
          parsed_response = JSON.parse(response.body.to_s)
          Rails.logger.info "[API-GATEWAY] Successfully parsed AI Engine response"
          return parsed_response
        rescue JSON::ParserError => e
          Rails.logger.error "[API-GATEWAY] Failed to parse AI Engine response: #{e.message}"
          Rails.logger.error "[API-GATEWAY] Response body: #{response.body.to_s[0..500]}"
          raise "Invalid JSON response from AI Engine: #{e.message}"
        end
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
