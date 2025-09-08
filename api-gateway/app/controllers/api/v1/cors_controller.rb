module Api
  module V1
    class CorsController < ApplicationController
      def preflight
        headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
        headers['Access-Control-Allow-Headers'] = 'Origin, Content-Type, Accept, Authorization, X-API-Key, X-Requested-With'
        headers['Access-Control-Max-Age'] = '1728000'
        
        render plain: '', status: 200
      end
    end
  end
end
