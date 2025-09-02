class User < ApplicationRecord
  has_many :api_keys, dependent: :destroy
  has_many :api_requests, through: :api_keys

  validates :email, presence: true, uniqueness: true
end
