class RenameModelNameToModelInChatAnalytics < ActiveRecord::Migration[8.0]
  def change
    rename_column :chat_analytics, :model_name, :model
  end
end
