class MakeApiKeyIdNullableInApiRequests < ActiveRecord::Migration[8.0]
  def change
    change_column_null :api_requests, :api_key_id, true
  end
end
