# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_09_08_022320) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "api_keys", force: :cascade do |t|
    t.bigint "user_id"
    t.string "name", null: false
    t.string "key", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_api_keys_on_key", unique: true
    t.index ["user_id"], name: "index_api_keys_on_user_id"
  end

  create_table "api_requests", force: :cascade do |t|
    t.bigint "api_key_id", null: false
    t.text "prompt", null: false
    t.integer "model_provider", null: false
    t.integer "status", default: 0, null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.string "ip_address"
    t.string "user_agent"
    t.text "error_message"
    t.json "response_data"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["api_key_id"], name: "index_api_requests_on_api_key_id"
    t.index ["created_at"], name: "index_api_requests_on_created_at"
    t.index ["model_provider"], name: "index_api_requests_on_model_provider"
    t.index ["status"], name: "index_api_requests_on_status"
  end

  create_table "chat_analytics", force: :cascade do |t|
    t.bigint "api_request_id", null: false
    t.integer "prompt_tokens", default: 0, null: false
    t.integer "completion_tokens", default: 0, null: false
    t.integer "total_tokens", default: 0, null: false
    t.string "model", null: false
    t.integer "response_time_ms", default: 0, null: false
    t.json "tools_used", default: []
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["api_request_id"], name: "index_chat_analytics_on_api_request_id"
    t.index ["created_at"], name: "index_chat_analytics_on_created_at"
    t.index ["model"], name: "index_chat_analytics_on_model"
    t.index ["total_tokens"], name: "index_chat_analytics_on_total_tokens"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "api_keys", "users"
  add_foreign_key "api_requests", "api_keys"
  add_foreign_key "chat_analytics", "api_requests"
end
