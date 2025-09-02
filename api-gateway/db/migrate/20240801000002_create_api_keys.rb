class CreateApiKeys < ActiveRecord::Migration[7.1]
  def change
    create_table :api_keys do |t|
      t.references :user, foreign_key: true
      t.string :name, null: false
      t.string :key, null: false, index: { unique: true }
      t.integer :status, default: 0, null: false
      
      t.timestamps
    end
  end
end
