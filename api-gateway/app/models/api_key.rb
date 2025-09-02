class ApiKey < ApplicationRecord
  belongs_to :user, optional: true
  has_many :api_requests

  before_create :generate_key
  
  validates :name, presence: true
  validates :key, uniqueness: true, allow_nil: true
  
  enum status: { active: 0, revoked: 1 }
  
  private
  
  def generate_key
    self.key = SecureRandom.hex(32)
  end
end
