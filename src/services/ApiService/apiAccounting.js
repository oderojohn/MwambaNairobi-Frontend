import { apiRequest } from './apiBase';

// Account API
export const accountsAPI = {
  getAccounts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/accounting/accounts/?${queryString}` : '/api/accounting/accounts/';
    return apiRequest(url);
  },
  
  getAccount: (id) => apiRequest(`/api/accounting/accounts/${id}/`),
  
  createAccount: (account) => apiRequest('/api/accounting/accounts/', 'POST', account),
  
  updateAccount: (id, account) => apiRequest(`/api/accounting/accounts/${id}/`, 'PUT', account),
  
  deleteAccount: (id) => apiRequest(`/api/accounting/accounts/${id}/`, 'DELETE'),
  
  getAccountsByType: () => apiRequest('/api/accounting/accounts/by_type/'),
  
  getAccountLedger: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/accounts/${id}/ledger/?${queryString}` 
      : `/api/accounting/accounts/${id}/ledger/`;
    return apiRequest(url);
  }
};

// Journal Entry API
export const journalEntriesAPI = {
  getJournalEntries: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/accounting/journal-entries/?${queryString}` : '/api/accounting/journal-entries/';
    return apiRequest(url);
  },
  
  getJournalEntry: (id) => apiRequest(`/api/accounting/journal-entries/${id}/`),
  
  createJournalEntry: (entry) => apiRequest('/api/accounting/journal-entries/', 'POST', entry),
  
  updateJournalEntry: (id, entry) => apiRequest(`/api/accounting/journal-entries/${id}/`, 'PUT', entry),
  
  deleteJournalEntry: (id) => apiRequest(`/api/accounting/journal-entries/${id}/`, 'DELETE'),
  
  postRecurring: () => apiRequest('/api/accounting/journal-entries/post_recurring/', 'POST')
};

// Recurring Expenses API
export const recurringExpensesAPI = {
  getRecurringExpenses: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/recurring-expenses/?${queryString}` 
      : '/api/accounting/recurring-expenses/';
    return apiRequest(url);
  },
  
  getRecurringExpense: (id) => apiRequest(`/api/accounting/recurring-expenses/${id}/`),
  
  createRecurringExpense: (expense) => apiRequest('/api/accounting/recurring-expenses/', 'POST', expense),
  
  updateRecurringExpense: (id, expense) => apiRequest(`/api/accounting/recurring-expenses/${id}/`, 'PUT', expense),
  
  deleteRecurringExpense: (id) => apiRequest(`/api/accounting/recurring-expenses/${id}/`, 'DELETE')
};

// Reports API
export const reportsAPI = {
  getTrialBalance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/reports/trial_balance/?${queryString}` 
      : '/api/accounting/reports/trial_balance/';
    return apiRequest(url);
  },
  
  getProfitLoss: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/reports/profit_loss/?${queryString}` 
      : '/api/accounting/reports/profit_loss/';
    return apiRequest(url);
  },
  
  getBalanceSheet: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/reports/balance_sheet/?${queryString}` 
      : '/api/accounting/reports/balance_sheet/';
    return apiRequest(url);
  }
};

// Automatic Entry Rules API
export const automaticRulesAPI = {
  getRules: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `/api/accounting/automatic-rules/?${queryString}` 
      : '/api/accounting/automatic-rules/';
    return apiRequest(url);
  },
  
  getRule: (id) => apiRequest(`/api/accounting/automatic-rules/${id}/`),
  
  createRule: (rule) => apiRequest('/api/accounting/automatic-rules/', 'POST', rule),
  
  updateRule: (id, rule) => apiRequest(`/api/accounting/automatic-rules/${id}/`, 'PUT', rule),
  
  deleteRule: (id) => apiRequest(`/api/accounting/automatic-rules/${id}/`, 'DELETE')
};
