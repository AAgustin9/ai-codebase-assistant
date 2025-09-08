# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create a default user for development
user = User.find_or_create_by!(email: 'admin@example.com') do |u|
  u.name = 'Admin User'
end

puts "Created user: #{user.email}"

# Create a default API key for development
api_key = ApiKey.find_or_create_by!(name: 'Development API Key') do |ak|
  ak.user = user
  ak.status = :active
end

puts "Created API key: #{api_key.key}"
puts "API Key ID: #{api_key.id}"
puts "You can use this API key in your frontend requests"
