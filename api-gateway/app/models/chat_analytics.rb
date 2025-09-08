class ChatAnalytics < ApplicationRecord
  belongs_to :api_request

  validates :prompt_tokens, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :completion_tokens, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_tokens, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :model, presence: true
  validates :response_time_ms, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Calculate cost based on model pricing (you can customize these rates)
  def estimated_cost
    case model
    when /gpt-4o/
      (prompt_tokens * 0.005 + completion_tokens * 0.015) / 1000
    when /gpt-4/
      (prompt_tokens * 0.03 + completion_tokens * 0.06) / 1000
    when /gpt-3.5-turbo/
      (prompt_tokens * 0.0015 + completion_tokens * 0.002) / 1000
    when /claude-3-5-sonnet/
      (prompt_tokens * 0.003 + completion_tokens * 0.015) / 1000
    when /claude-3-opus/
      (prompt_tokens * 0.015 + completion_tokens * 0.075) / 1000
    else
      # Default fallback pricing
      (total_tokens * 0.002) / 1000
    end
  end

  # Analytics methods
  def self.total_tokens_by_period(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date).sum(:total_tokens)
  end

  def self.total_cost_by_period(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date).sum { |analytics| analytics.estimated_cost }
  end

  def self.usage_by_model(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group(:model)
      .sum(:total_tokens)
  end

  def self.usage_by_day(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group("DATE(created_at)")
      .sum(:total_tokens)
  end

  def self.average_response_time_by_model(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group(:model)
      .average(:response_time_ms)
  end

  def self.daily_metrics(start_date = 30.days.ago, end_date = Time.current)
    where(created_at: start_date..end_date)
      .group("DATE(created_at)")
      .select(
        "DATE(created_at) as date",
        "SUM(total_tokens) as total_tokens",
        "SUM(prompt_tokens) as total_prompt_tokens",
        "SUM(completion_tokens) as total_completion_tokens",
        "COUNT(*) as request_count",
        "AVG(response_time_ms) as avg_response_time"
      )
  end
end
