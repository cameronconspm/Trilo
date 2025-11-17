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

  static async findById(accountId) {
    try {
      // Use regular select() instead of maybeSingle() to completely avoid PGRST116
      // This returns an array, which is empty if no rows found
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId);
      
      if (error) {
        // PGRST116 means "not found" - return null, don't throw
        const errorCode = error?.code || error?.error?.code;
        const errorMessage = error?.message || error?.error?.message || String(error || '');
        if (errorCode === 'PGRST116' || 
            errorMessage.includes('PGRST116') || 
            errorMessage.includes('0 rows') ||
            errorMessage.includes('Cannot coerce')) {
          console.log('[BankAccount Model]   Account not found (PGRST116) - returning null');
          console.log('[BankAccount Model]   Error code:', errorCode);
          console.log('[BankAccount Model]   Error message:', errorMessage);
          return null;
        }
        // Only throw non-PGRST116 errors
        throw error;
      }
      
      // Return first item if array has items, null otherwise
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      // Catch any PGRST116 errors that slip through
      const errCode = err?.code || err?.error?.code || err?.details?.code;
      const errMessage = err?.message || err?.error?.message || String(err || '');
      if (errCode === 'PGRST116' || 
          errMessage.includes('PGRST116') || 
          errMessage.includes('0 rows') ||
          errMessage.includes('Cannot coerce')) {
        console.log('[BankAccount Model]   PGRST116 caught in catch block - returning null');
        console.log('[BankAccount Model]   Error code:', errCode);
        console.log('[BankAccount Model]   Error message:', errMessage);
        return null;
      }
      throw err;
    }
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
    console.log('[BankAccount Model] 🗑️  Deleting account:', accountId);
    console.log('[BankAccount Model]   Account ID type:', typeof accountId);
    
    // DON'T use .select() to avoid PGRST116 when 0 rows are deleted
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', accountId);
    
    if (error) {
      // Check if it's PGRST116 (account not found)
      if (error.code === 'PGRST116' || 
          error.message?.includes('PGRST116') || 
          error.message?.includes('0 rows') ||
          error.message?.includes('Cannot coerce')) {
        console.log('[BankAccount Model]   Account not found (PGRST116) - treating as success');
        return true; // Account doesn't exist = success
      }
      
      console.error('[BankAccount Model] ❌ Delete error:', error);
      console.error('[BankAccount Model]   Error code:', error.code);
      console.error('[BankAccount Model]   Error message:', error.message);
      console.error('[BankAccount Model]   Error details:', error.details);
      console.error('[BankAccount Model]   Error hint:', error.hint);
      throw error;
    }
    
    console.log('[BankAccount Model] ✅ Delete successful');
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

