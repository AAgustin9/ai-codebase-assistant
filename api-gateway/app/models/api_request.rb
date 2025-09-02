class ApiRequest < ApplicationRecord
  belongs_to :api_key

  enum status: { pending: 0, success: 1, error: 2 }
  enum model_provider: { gpt: 0, claude: 1, gemini: 2 }
  
  validates :prompt, presence: true
  validates :model_provider, presence: true

  # Allow accessing the associated user through api_key
  delegate :user, to: :api_key, allow_nil: true
  
  def duration_ms
    return nil unless started_at && completed_at
    ((completed_at - started_at) * 1000).round
  end
  
  def self.analytics_by_day(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group("DATE(created_at)")
      .count
  end
  
  def self.analytics_by_model(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group(:model_provider)
      .count
  end
  
  def self.analytics_by_status(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group(:status)
      .count
  end
end
