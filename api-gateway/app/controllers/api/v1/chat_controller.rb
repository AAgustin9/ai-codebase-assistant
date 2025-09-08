module Api
  module V1
    class ChatController < ApplicationController
      
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
        # Handle both direct params and nested chat params
        if params[:chat].present?
          params.require(:chat).permit(:prompt, :model, options: {})
        else
          params.permit(:prompt, :model, options: {})
        end
      end
      
      # analytics
      def create_api_request
        # Map model names to enum values
        model_name = chat_params[:model] || 'gpt'
        model_provider = case model_name.downcase
        when /gpt/
          'gpt'
        when /claude/
          'claude'
        when /gemini/
          'gemini'
        else
          'gpt'  # default fallback
        end
        
        ApiRequest.create!(
          prompt: chat_params[:prompt],
          model_provider: model_provider,
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          status: :pending,
          api_key: nil  # No API key required
        )
      end
      
      def forward_to_ai_engine(params)
        ai_engine_base = ENV.fetch('AI_ENGINE_URL', 'http://localhost:3001/api/v1')
        tools_value = params.dig(:options, :tools).to_i
        
        # Route to different endpoints based on tools value
        endpoint = case tools_value
        when 0
          '/ai/generate'
        when 1
          '/ai/github/files'
        when 2
          '/ai/github/content'
        when 3
          '/ai/github/upsert'
        else
          '/ai/ai/generate'
        end
        
        full_url = "#{ai_engine_base}#{endpoint}"
      
        Rails.logger.info "[API-GATEWAY] -> AI: #{full_url}"
      
        req_headers = {
          'Content-Type'   => 'application/json',
          'Accept'         => 'application/json',
          # Trazabilidad:
          'X-Request-Id'   => request.request_id,
          'X-Forwarded-For'=> request.remote_ip,
        }.compact
      
        payload = {
          prompt:  params[:prompt],
          options: {
            model: params[:model],
            **(params[:options] || {}).to_h
          }
        }
      
        # timeouts razonables (http.rb)
        http_client = HTTP.timeout(connect: 5, write: 10, read: 25)
                          .headers(req_headers)
      
        begin
          started = Time.current
          response = http_client.post(full_url, json: payload)
          dur = Time.current - started
      
          Rails.logger.info "[API-GATEWAY] <- AI status=#{response.status} in #{dur.round(2)}s"
      
          # Si no es 2xx, levanta con el cuerpo (útil para debug)
          unless response.status.success?
            body = response.to_s
            raise "AI Engine error (#{response.status}): #{body.first(500)}"
          end
      
          JSON.parse(response.to_s)
        rescue => e
          Rails.logger.error "[API-GATEWAY] forward_to_ai_engine failed: #{e.message}"
          raise
        end
      end
      
    end
  end
end
