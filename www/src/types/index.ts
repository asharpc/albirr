
// Student Types
export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  mothor_name: string;
  father_name: string;
  parent_phone_primary: string;
  parent_phone_secondary?: string;
  address: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

// Staff Types
export interface Staff {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role?: {
    id: string;
    name: string;
    description: string;
  };
  hire_date: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Financial Types
export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedTo?: {
    type: 'student' | 'staff' | 'other';
    id?: string;
    name?: string;
  };
}

export interface BalanceSheet {
  month: string;
  year: string;
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'parent';
}

// Finance Types
export interface ExpenseType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  transaction_type_display: string;
  category: string;
  category_display: string;
  amount: number;
  description: string;
  transaction_date: string;
  student?: Student;
  staff?: Staff;
  expense_type?: ExpenseType;
  notes: string;
  created_by: string;
  related_entity: {
    type: 'student' | 'staff' | 'expense_type' | 'other';
    id?: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StudentFee {
  id: string;
  student: Student;
  fee_type: 'TUITION' | 'ADMISSION' | 'AMENITY' | 'OTHER';
  fee_type_display: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  month_year?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  status_display: string;
  is_overdue: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface StaffSalary {
  id: string;
  staff: Staff;
  base_amount: number;
  deductions: number;
  bonuses: number;
  final_amount: number;
  paid_amount: number;
  pending_amount: number;
  month_year: string;
  pay_date: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  status_display: string;
  is_overdue: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FeePayment {
  id: string;
  student_fee: StudentFee;
  transaction: Transaction;
  amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE' | 'OTHER';
  payment_method_display: string;
  payment_date: string;
  reference_number: string;
  reference_image?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryPayment {
  id: string;
  staff_salary: StaffSalary;
  transaction: Transaction;
  amount: number;
  payment_method: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
  payment_method_display: string;
  payment_date: string;
  reference_number: string;
  reference_image?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  pending_fees: number;
  pending_salaries: number;
  students_with_pending_fees: number;
  staff_with_pending_salaries: number;
}

export interface MonthlyFinanceSummary {
  month_year: string;
  income: number;
  expenses: number;
  balance: number;
  transaction_count: number;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: any;
}

export interface DashboardStats {
  // Basic counts
  total_students: number;
  total_staff: number;
  active_students: number;
  active_staff: number;
  
  // Financial overview
  current_month_income: number;
  current_month_expenses: number;
  current_month_balance: number;
  total_pending_fees: number;
  total_pending_salaries: number;
  
  // Student statistics
  students_with_pending_fees: number;
  students_with_overdue_fees: number;
  total_fee_collections_today: number;
  
  // Staff statistics
  staff_with_pending_salaries: number;
  staff_with_overdue_salaries: number;
  staff_without_roles: number;
  total_salary_payments_today: number;
  
  // Recent activity
  recent_student_admissions: number;
  recent_staff_additions: number;
  recent_transactions_count: number;
  
  // Performance metrics
  fee_collection_rate: number;
  salary_payment_rate: number;
  average_fee_amount: number;
  average_salary_amount: number;
  
  // Monthly trends
  monthly_income_trend: number[];
  monthly_expense_trend: number[];
  monthly_student_trend: number[];
  monthly_staff_trend: number[];
  
  // Alerts
  overdue_fees_alert: boolean;
  overdue_salaries_alert: boolean;
  low_collection_alert: boolean;
  
  // Additional insights
  top_fee_categories: Array<{fee_type: string; total: number; count: number}>;
  top_expense_categories: Array<{category: string; total: number; count: number}>;
  payment_method_distribution: Array<{payment_method: string; total: number; count: number}>;
}
