-- Gamified Challenge System Database Schema
-- This schema supports tracking user financial challenges, progress, and achievements

-- Users table (if not already exists)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Challenge templates - predefined challenge types
CREATE TABLE challenge_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('debt_paydown', 'savings', 'spending_limit', 'emergency_fund') NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL DEFAULT 7,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    points_reward INT NOT NULL DEFAULT 100,
    badge_reward VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User challenges - active challenges assigned to users
CREATE TABLE user_challenges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36) NOT NULL,
    challenge_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('debt_paydown', 'savings', 'spending_limit', 'emergency_fund') NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'completed', 'failed', 'paused') DEFAULT 'active',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    points_reward INT NOT NULL DEFAULT 100,
    badge_reward VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES challenge_templates(id),
    INDEX idx_user_challenges_user_id (user_id),
    INDEX idx_user_challenges_status (status),
    INDEX idx_user_challenges_end_date (end_date)
);

-- Challenge progress tracking - daily snapshots of progress
CREATE TABLE challenge_progress (
    id VARCHAR(36) PRIMARY KEY,
    challenge_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    progress_date DATE NOT NULL,
    amount_progress DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    percentage_complete DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    daily_change DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES user_challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_progress (challenge_id, progress_date),
    INDEX idx_progress_challenge_date (challenge_id, progress_date),
    INDEX idx_progress_user_date (user_id, progress_date)
);

-- User badges - earned achievements
CREATE TABLE user_badges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    badge_name VARCHAR(50) NOT NULL,
    badge_type ENUM('debt_paydown', 'savings', 'consistency', 'milestone', 'streak') NOT NULL,
    badge_description TEXT NOT NULL,
    earned_date DATE NOT NULL,
    challenge_id VARCHAR(36),
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES user_challenges(id) ON DELETE SET NULL,
    INDEX idx_user_badges_user_id (user_id),
    INDEX idx_user_badges_type (badge_type),
    INDEX idx_user_badges_earned_date (earned_date)
);

-- User financial score - overall gamification score
CREATE TABLE user_financial_scores (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total_points INT DEFAULT 0,
    debt_paydown_points INT DEFAULT 0,
    savings_points INT DEFAULT 0,
    consistency_points INT DEFAULT 0,
    milestone_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    level_name VARCHAR(50) DEFAULT 'Novice',
    weekly_score INT DEFAULT 0,
    monthly_score INT DEFAULT 0,
    last_reset_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_score (user_id),
    INDEX idx_scores_user_id (user_id),
    INDEX idx_scores_level (current_level)
);

-- Challenge completion history
CREATE TABLE challenge_completions (
    id VARCHAR(36) PRIMARY KEY,
    challenge_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    completion_date DATE NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL,
    points_earned INT NOT NULL DEFAULT 0,
    badges_earned JSON,
    completion_time_hours INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES user_challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_completions_user_id (user_id),
    INDEX idx_completions_date (completion_date),
    INDEX idx_completions_challenge (challenge_id)
);

-- Weekly challenge reset tracking
CREATE TABLE weekly_resets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    reset_week_start DATE NOT NULL,
    reset_week_end DATE NOT NULL,
    challenges_completed INT DEFAULT 0,
    challenges_failed INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    badges_earned INT DEFAULT 0,
    reset_completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weekly_reset (user_id, reset_week_start),
    INDEX idx_resets_user_week (user_id, reset_week_start)
);

-- Insert default challenge templates
INSERT INTO challenge_templates (id, name, description, type, target_amount, duration_days, difficulty, points_reward, badge_reward) VALUES
('template_001', 'Weekly Debt Paydown', 'Pay down $100 in debt this week', 'debt_paydown', 100.00, 7, 'easy', 150, 'debt_buster'),
('template_002', 'Monthly Savings Goal', 'Save $500 this month', 'savings', 500.00, 30, 'medium', 300, 'saver_star'),
('template_003', 'Emergency Fund Builder', 'Build $1000 emergency fund', 'savings', 1000.00, 60, 'hard', 500, 'emergency_hero'),
('template_004', 'Spending Discipline', 'Keep weekly spending under $200', 'spending_limit', 200.00, 7, 'medium', 200, 'spending_wise'),
('template_005', 'Debt Freedom Sprint', 'Pay off $1000 in debt this month', 'debt_paydown', 1000.00, 30, 'hard', 600, 'debt_destroyer'),
('template_006', 'Weekly Saver', 'Save $50 every week for 4 weeks', 'savings', 200.00, 28, 'easy', 250, 'consistent_saver'),
('template_007', 'Credit Card Killer', 'Pay off entire credit card balance', 'debt_paydown', 0.00, 90, 'hard', 800, 'credit_card_conqueror'),
('template_008', 'No Spend Week', 'Spend $0 on non-essentials for 7 days', 'spending_limit', 0.00, 7, 'hard', 400, 'no_spend_ninja');

-- Create indexes for better performance
CREATE INDEX idx_challenge_templates_type ON challenge_templates(type);
CREATE INDEX idx_challenge_templates_difficulty ON challenge_templates(difficulty);
CREATE INDEX idx_user_challenges_type_status ON user_challenges(type, status);
CREATE INDEX idx_challenge_progress_date_range ON challenge_progress(progress_date);
