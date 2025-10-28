const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trilo_challenges',
  port: process.env.DB_PORT || 3306
};

// Challenge Service Class
class ChallengeService {
  constructor() {
    this.pool = mysql.createPool(dbConfig);
  }

  // Get all available challenge templates
  async getChallengeTemplates() {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM challenge_templates WHERE is_active = TRUE ORDER BY difficulty, points_reward'
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get user's active challenges
  async getUserActiveChallenges(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT uc.*, ct.name as template_name, ct.description as template_description
         FROM user_challenges uc
         JOIN challenge_templates ct ON uc.template_id = ct.id
         WHERE uc.user_id = ? AND uc.status = 'active'
         ORDER BY uc.end_date ASC`,
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Create a new challenge for user
  async createUserChallenge(userId, templateId, customTarget = null) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get template details
      const [templateRows] = await connection.execute(
        'SELECT * FROM challenge_templates WHERE id = ?',
        [templateId]
      );

      if (templateRows.length === 0) {
        throw new Error('Challenge template not found');
      }

      const template = templateRows[0];
      const targetAmount = customTarget || template.target_amount;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + template.duration_days);

      // Create user challenge
      const challengeId = uuidv4();
      await connection.execute(
        `INSERT INTO user_challenges 
         (id, user_id, template_id, challenge_name, description, type, target_amount, 
          start_date, end_date, points_reward, badge_reward)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
        [
          challengeId,
          userId,
          templateId,
          template.name,
          template.description,
          template.type,
          targetAmount,
          endDate.toISOString().split('T')[0],
          template.points_reward,
          template.badge_reward
        ]
      );

      await connection.commit();
      return challengeId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update challenge progress based on account data
  async updateChallengeProgress(userId, accountData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get user's active challenges
      const [challenges] = await connection.execute(
        'SELECT * FROM user_challenges WHERE user_id = ? AND status = "active"',
        [userId]
      );

      const today = new Date().toISOString().split('T')[0];
      const progressUpdates = [];

      for (const challenge of challenges) {
        let progressChange = 0;
        let newCurrentAmount = challenge.current_amount;

        // Calculate progress based on challenge type
        switch (challenge.type) {
          case 'debt_paydown':
            // For debt paydown, we track reduction in debt balances
            const debtReduction = this.calculateDebtReduction(accountData, challenge);
            progressChange = debtReduction;
            newCurrentAmount = Math.max(0, challenge.current_amount + debtReduction);
            break;

          case 'savings':
            // For savings, we track increase in savings balances
            const savingsIncrease = this.calculateSavingsIncrease(accountData, challenge);
            progressChange = savingsIncrease;
            newCurrentAmount = challenge.current_amount + savingsIncrease;
            break;

          case 'spending_limit':
            // For spending limits, we track spending against the limit
            const spendingAmount = this.calculateSpending(accountData, challenge);
            progressChange = spendingAmount;
            newCurrentAmount = spendingAmount;
            break;

          case 'emergency_fund':
            // For emergency fund, we track savings account growth
            const emergencyFundGrowth = this.calculateEmergencyFundGrowth(accountData, challenge);
            progressChange = emergencyFundGrowth;
            newCurrentAmount = challenge.current_amount + emergencyFundGrowth;
            break;
        }

        // Update challenge progress
        const progressPercentage = Math.min(100, (newCurrentAmount / challenge.target_amount) * 100);
        
        await connection.execute(
          `UPDATE user_challenges 
           SET current_amount = ?, progress_percentage = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newCurrentAmount, progressPercentage, challenge.id]
        );

        // Record daily progress
        await connection.execute(
          `INSERT INTO challenge_progress 
           (id, challenge_id, user_id, progress_date, amount_progress, percentage_complete, daily_change)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           amount_progress = VALUES(amount_progress),
           percentage_complete = VALUES(percentage_complete),
           daily_change = VALUES(daily_change)`,
          [
            uuidv4(),
            challenge.id,
            userId,
            today,
            newCurrentAmount,
            progressPercentage,
            progressChange
          ]
        );

        // Check if challenge is completed
        if (progressPercentage >= 100) {
          await this.completeChallenge(connection, challenge, userId);
        }

        progressUpdates.push({
          challengeId: challenge.id,
          progressChange,
          newCurrentAmount,
          progressPercentage
        });
      }

      await connection.commit();
      return progressUpdates;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper methods for calculating progress
  calculateDebtReduction(accountData, challenge) {
    // Calculate debt reduction from credit cards and loans
    const debtAccounts = accountData.filter(account => 
      account.type === 'credit_card' || account.type === 'loan'
    );
    
    let totalDebtReduction = 0;
    debtAccounts.forEach(account => {
      // This would compare with previous balance to calculate reduction
      // For now, we'll use a mock calculation
      totalDebtReduction += Math.random() * 50; // Mock debt reduction
    });
    
    return totalDebtReduction;
  }

  calculateSavingsIncrease(accountData, challenge) {
    // Calculate savings increase from savings accounts
    const savingsAccounts = accountData.filter(account => 
      account.type === 'savings'
    );
    
    let totalSavingsIncrease = 0;
    savingsAccounts.forEach(account => {
      // This would compare with previous balance to calculate increase
      // For now, we'll use a mock calculation
      totalSavingsIncrease += Math.random() * 25; // Mock savings increase
    });
    
    return totalSavingsIncrease;
  }

  calculateSpending(accountData, challenge) {
    // Calculate spending from transactions
    // This would analyze recent transactions
    return Math.random() * 100; // Mock spending amount
  }

  calculateEmergencyFundGrowth(accountData, challenge) {
    // Calculate emergency fund growth
    return Math.random() * 30; // Mock emergency fund growth
  }

  // Complete a challenge
  async completeChallenge(connection, challenge, userId) {
    const completionId = uuidv4();
    const completionDate = new Date().toISOString().split('T')[0];
    
    // Mark challenge as completed
    await connection.execute(
      'UPDATE user_challenges SET status = "completed" WHERE id = ?',
      [challenge.id]
    );

    // Record completion
    await connection.execute(
      `INSERT INTO challenge_completions 
       (id, challenge_id, user_id, completion_date, final_amount, completion_percentage, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        completionId,
        challenge.id,
        userId,
        completionDate,
        challenge.current_amount,
        challenge.progress_percentage,
        challenge.points_reward
      ]
    );

    // Award badge if applicable
    if (challenge.badge_reward) {
      await connection.execute(
        `INSERT INTO user_badges 
         (id, user_id, badge_name, badge_type, badge_description, earned_date, challenge_id, points_earned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          userId,
          challenge.badge_reward,
          challenge.type,
          `Earned for completing: ${challenge.challenge_name}`,
          completionDate,
          challenge.id,
          challenge.points_reward
        ]
      );
    }

    // Update user score
    await this.updateUserScore(connection, userId, challenge.points_reward);
  }

  // Update user financial score
  async updateUserScore(connection, userId, pointsEarned) {
    // Get or create user score record
    const [scoreRows] = await connection.execute(
      'SELECT * FROM user_financial_scores WHERE user_id = ?',
      [userId]
    );

    if (scoreRows.length === 0) {
      // Create new score record
      await connection.execute(
        `INSERT INTO user_financial_scores 
         (id, user_id, total_points, weekly_score, monthly_score, last_reset_date)
         VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [uuidv4(), userId, pointsEarned, pointsEarned, pointsEarned]
      );
    } else {
      // Update existing score
      const currentScore = scoreRows[0];
      const newTotalPoints = currentScore.total_points + pointsEarned;
      const newWeeklyScore = currentScore.weekly_score + pointsEarned;
      const newMonthlyScore = currentScore.monthly_score + pointsEarned;
      
      // Calculate level based on total points
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;
      const levelNames = ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'];
      const levelName = levelNames[Math.min(newLevel - 1, levelNames.length - 1)];

      await connection.execute(
        `UPDATE user_financial_scores 
         SET total_points = ?, weekly_score = ?, monthly_score = ?, 
             current_level = ?, level_name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [newTotalPoints, newWeeklyScore, newMonthlyScore, newLevel, levelName, userId]
      );
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_date DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Get user financial score
  async getUserScore(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM user_financial_scores WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  // Weekly reset for challenges
  async performWeeklyReset(userId) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week

      // Get completed and failed challenges for the week
      const [completedChallenges] = await connection.execute(
        `SELECT COUNT(*) as count FROM challenge_completions 
         WHERE user_id = ? AND completion_date BETWEEN ? AND ?`,
        [userId, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
      );

      const [failedChallenges] = await connection.execute(
        `SELECT COUNT(*) as count FROM user_challenges 
         WHERE user_id = ? AND status = 'failed' AND end_date BETWEEN ? AND ?`,
        [userId, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
      );

      // Get badges earned this week
      const [badgesEarned] = await connection.execute(
        `SELECT COUNT(*) as count FROM user_badges 
         WHERE user_id = ? AND earned_date BETWEEN ? AND ?`,
        [userId, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
      );

      // Record weekly reset
      await connection.execute(
        `INSERT INTO weekly_resets 
         (id, user_id, reset_week_start, reset_week_end, challenges_completed, 
          challenges_failed, badges_earned)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         challenges_completed = VALUES(challenges_completed),
         challenges_failed = VALUES(challenges_failed),
         badges_earned = VALUES(badges_earned)`,
        [
          uuidv4(),
          userId,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0],
          completedChallenges[0].count,
          failedChallenges[0].count,
          badgesEarned[0].count
        ]
      );

      // Reset weekly score
      await connection.execute(
        'UPDATE user_financial_scores SET weekly_score = 0 WHERE user_id = ?',
        [userId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

const challengeService = new ChallengeService();

// API Routes

// Get all challenge templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await challengeService.getChallengeTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's active challenges
router.get('/user/:userId/active', async (req, res) => {
  try {
    const { userId } = req.params;
    const challenges = await challengeService.getUserActiveChallenges(userId);
    res.json({ success: true, data: challenges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new challenge for user
router.post('/user/:userId/create', async (req, res) => {
  try {
    const { userId } = req.params;
    const { templateId, customTarget } = req.body;
    
    const challengeId = await challengeService.createUserChallenge(userId, templateId, customTarget);
    res.json({ success: true, data: { challengeId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update challenge progress
router.post('/user/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountData } = req.body;
    
    const progressUpdates = await challengeService.updateChallengeProgress(userId, accountData);
    res.json({ success: true, data: progressUpdates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user badges
router.get('/user/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await challengeService.getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user financial score
router.get('/user/:userId/score', async (req, res) => {
  try {
    const { userId } = req.params;
    const score = await challengeService.getUserScore(userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Perform weekly reset
router.post('/user/:userId/reset-weekly', async (req, res) => {
  try {
    const { userId } = req.params;
    await challengeService.performWeeklyReset(userId);
    res.json({ success: true, message: 'Weekly reset completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
