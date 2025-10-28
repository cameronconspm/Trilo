const supabase = require('../config/supabase');

// Bank Account Model
class BankAccount {
  static async create(accountData) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([accountData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  }

  static async findByAccessToken(accessToken) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('access_token', accessToken)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateBalance(accountId, balance) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({ current_balance: balance, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(accountId) {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', accountId);
    
    if (error) throw error;
    return true;
  }
}

// Transaction Model
class Transaction {
  static async create(transactionData) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async findByAccountId(accountId, limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async findByUserId(userId, limit = 100) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        bank_accounts!inner(user_id)
      `)
      .eq('bank_accounts.user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async bulkCreate(transactions) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();
    
    if (error) throw error;
    return data;
  }
}

module.exports = {
  BankAccount,
  Transaction
};

