class CreateChatAnalytics < ActiveRecord::Migration[8.0]
  def change
    create_table :chat_analytics do |t|
      t.references :api_request, null: false, foreign_key: true
      t.integer :prompt_tokens, null: false, default: 0
      t.integer :completion_tokens, null: false, default: 0
      t.integer :total_tokens, null: false, default: 0
      t.string :model_name, null: false
      t.integer :response_time_ms, null: false, default: 0
      t.json :tools_used, default: []
      t.text :error_message
      t.timestamps
    end

    add_index :chat_analytics, :created_at
    add_index :chat_analytics, :model_name
    add_index :chat_analytics, :total_tokens
  end
end
