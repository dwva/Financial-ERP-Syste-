// Utility functions for working with expense data

import { Expense } from '@/contexts/DataContext';

/**
 * Extract company names from a list of expenses
 * @param expenses - Array of expense objects
 * @returns Array of unique company names
 */
export const getCompanyNamesFromExpenses = (expenses: Expense[]): string[] => {
  const companyNames = expenses
    .map(expense => expense.company)
    .filter((companyName): companyName is string => companyName !== undefined && companyName !== null && companyName.trim() !== '')
    .map(companyName => companyName.trim());
  
  // Return unique company names
  return [...new Set(companyNames)];
};

/**
 * Get company names with frequency count
 * @param expenses - Array of expense objects
 * @returns Object with company names as keys and frequency as values
 */
export const getCompanyNamesWithFrequency = (expenses: Expense[]): Record<string, number> => {
  const companyNames = getCompanyNamesFromExpenses(expenses);
  const frequency: Record<string, number> = {};
  
  expenses.forEach(expense => {
    if (expense.company && expense.company.trim() !== '') {
      const companyName = expense.company.trim();
      frequency[companyName] = (frequency[companyName] || 0) + 1;
    }
  });
  
  return frequency;
};

/**
 * Get client names from a list of expenses
 * @param expenses - Array of expense objects
 * @returns Array of unique client names
 */
export const getClientNamesFromExpenses = (expenses: Expense[]): string[] => {
  const clientNames = expenses
    .map(expense => expense.clientName)
    .filter((clientName): clientName is string => clientName !== undefined && clientName !== null && clientName.trim() !== '')
    .map(clientName => clientName.trim());
  
  // Return unique client names
  return [...new Set(clientNames)];
};