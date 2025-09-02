class CreateApiRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :api_requests do |t|
      t.references :api_key, null: false, foreign_key: true
      t.text :prompt, null: false
      t.integer :model_provider, null: false
      t.integer :status, default: 0, null: false
      t.datetime :started_at
      t.datetime :completed_at
      t.string :ip_address
      t.string :user_agent
      t.text :error_message
      t.json :response_data
      
      t.timestamps
    end
    
    add_index :api_requests, :created_at
    add_index :api_requests, :model_provider
    add_index :api_requests, :status
  end
end
