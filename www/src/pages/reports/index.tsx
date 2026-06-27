import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  GraduationCap
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Transaction, StudentFee, StaffSalary, PaginatedResponse } from "@/types";

interface ReportData {
  financial_summary: {
    total_income: number;
    total_expenses: number;
    net_balance: number;
    transaction_count: number;
  };
  fee_summary: {
    total_fees: number;
    collected_fees: number;
    pending_fees: number;
    students_count: number;
    paid_students: number;
    pending_students: number;
  };
  salary_summary: {
    total_salaries: number;
    paid_salaries: number;
    pending_salaries: number;
    staff_count: number;
    paid_staff: number;
    pending_staff: number;
  };
  monthly_trends: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  category_breakdown: Array<{
    category: string;
    amount: number;
    count: number;
    type: 'income' | 'expense';
  }>;
  transactions: Transaction[];
  student_fees: StudentFee[];
  staff_salaries: StaffSalary[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export default function ReportsPage() {
  const [viewType, setViewType] = useState<'table' | 'chart'>('table');
  const [filterType, setFilterType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));

  // Generate period options
  const periodOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    
    if (filterType === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        options.push({
          value: format(date, 'yyyy-MM'),
          label: format(date, 'MMMM yyyy')
        });
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const year = currentDate.getFullYear() - i;
        options.push({
          value: year.toString(),
          label: year.toString()
        });
      }
    }
    return options;
  }, [filterType]);

  // Fetch report data
  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", filterType, selectedPeriod],
    queryFn: async () => {
      let startDate, endDate;
      
      if (filterType === 'monthly') {
        const date = new Date(selectedPeriod + '-01');
        startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        endDate = format(endOfMonth(date), 'yyyy-MM-dd');
      } else {
        const year = parseInt(selectedPeriod);
        startDate = format(startOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd');
        endDate = format(endOfYear(new Date(year, 0, 1)), 'yyyy-MM-dd');
      }

      const response = await api.get(`/reports/comprehensive/?start_date=${startDate}&end_date=${endDate}&filter_type=${filterType}`);
      return response.data;
    },
  });

  // Export functions
  const exportToExcel = (data: any[], filename: string, sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportToCSV = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const handleExportFinancial = (format: 'csv' | 'excel') => {
    if (!reportData) return;
    
    const data = reportData.transactions.map(transaction => ({
      Date: transaction.transaction_date,
      Type: transaction.transaction_type_display,
      Category: transaction.category_display,
      Description: transaction.description,
      Amount: transaction.amount,
      'Related Entity': transaction.related_entity.name
    }));

    const filename = `financial_report_${selectedPeriod}`;
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToExcel(data, filename, 'Financial Report');
    }
  };

  const handleExportFees = (format: 'csv' | 'excel') => {
    if (!reportData) return;
    
    const data = reportData.student_fees.map(fee => ({
      'Student Name': `${fee.student.first_name} ${fee.student.last_name}`,
      'Student ID': fee.student.student_id,
      'Fee Type': fee.fee_type_display,
      'Total Amount': fee.total_amount,
      'Paid Amount': fee.paid_amount,
      'Pending Amount': fee.pending_amount,
      'Due Date': fee.due_date,
      'Status': fee.status_display,
      'Month/Year': fee.month_year || 'N/A'
    }));

    const filename = `fee_report_${selectedPeriod}`;
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToExcel(data, filename, 'Fee Report');
    }
  };

  const handleExportSalaries = (format: 'csv' | 'excel') => {
    if (!reportData) return;
    
    const data = reportData.staff_salaries.map(salary => ({
      'Staff Name': `${salary.staff.first_name} ${salary.staff.last_name}`,
      'Staff ID': salary.staff.staff_id,
      'Base Amount': salary.base_amount,
      'Deductions': salary.deductions,
      'Bonuses': salary.bonuses,
      'Final Amount': salary.final_amount,
      'Paid Amount': salary.paid_amount,
      'Pending Amount': salary.pending_amount,
      'Month/Year': salary.month_year,
      'Status': salary.status_display,
      'Pay Date': salary.pay_date
    }));

    const filename = `salary_report_${selectedPeriod}`;
    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToExcel(data, filename, 'Salary Report');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <div className="flex items-center gap-3">
            <Select value={filterType} onValueChange={(value: 'monthly' | 'yearly') => setFilterType(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={viewType} onValueChange={(value: 'table' | 'chart') => setViewType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Table
                  </div>
                </SelectItem>
                <SelectItem value="chart">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Charts
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {reportData && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{reportData.financial_summary.total_income.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filterType === 'monthly' ? 'This month' : 'This year'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ₹{reportData.financial_summary.total_expenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {filterType === 'monthly' ? 'This month' : 'This year'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.financial_summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{reportData.financial_summary.net_balance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.financial_summary.net_balance >= 0 ? 'Profit' : 'Loss'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.financial_summary.transaction_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total transactions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="fees">Student Fees</TabsTrigger>
            <TabsTrigger value="salaries">Staff Salaries</TabsTrigger>
          </TabsList>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Report</CardTitle>
                  <CardDescription>
                    Income, expenses and transaction analysis for {periodOptions.find(p => p.value === selectedPeriod)?.label}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportFinancial('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportFinancial('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewType === 'chart' ? (
                  <div className="space-y-6">
                    {/* Monthly Trends Chart */}
                    {reportData?.monthly_trends && reportData.monthly_trends.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={reportData.monthly_trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Category Breakdown */}
                    {reportData?.category_breakdown && reportData.category_breakdown.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Income by Category</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={reportData.category_breakdown.filter(item => item.type === 'income')}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                              >
                                {reportData.category_breakdown.filter(item => item.type === 'income').map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={reportData.category_breakdown.filter(item => item.type === 'expense')}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                              >
                                {reportData.category_breakdown.filter(item => item.type === 'expense').map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <DataTable
                    columns={[
                      { accessorKey: "transaction_date", header: "Date" },
                      { 
                        accessorKey: "transaction_type_display", 
                        header: "Type",
                        cell: ({ row }) => (
                          <Badge variant={row.original.transaction_type === 'INCOME' ? 'default' : 'destructive'}>
                            {row.getValue("transaction_type_display")}
                          </Badge>
                        )
                      },
                      { accessorKey: "category_display", header: "Category" },
                      { accessorKey: "description", header: "Description" },
                      { 
                        accessorKey: "amount", 
                        header: "Amount",
                        cell: ({ row }) => (
                          <span className={row.original.transaction_type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                            ₹{row.getValue<number>("amount").toLocaleString()}
                          </span>
                        )
                      },
                      { 
                        accessorKey: "related_entity.name", 
                        header: "Related To",
                        cell: ({ row }) => row.original.related_entity.name
                      }
                    ]}
                    data={reportData?.transactions || []}
                    searchColumn="description"
                    searchPlaceholder="Search transactions..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Fees Tab */}
          <TabsContent value="fees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Student Fee Report</CardTitle>
                  <CardDescription>
                    Fee collection status for {periodOptions.find(p => p.value === selectedPeriod)?.label}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportFees('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportFees('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Fee Summary Cards */}
                {reportData && (
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportData.fee_summary.students_count}</div>
                        <p className="text-xs text-muted-foreground">
                          {reportData.fee_summary.paid_students} paid, {reportData.fee_summary.pending_students} pending
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Collected Fees</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{reportData.fee_summary.collected_fees.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {((reportData.fee_summary.collected_fees / reportData.fee_summary.total_fees) * 100).toFixed(1)}% collected
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">₹{reportData.fee_summary.pending_fees.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {((reportData.fee_summary.pending_fees / reportData.fee_summary.total_fees) * 100).toFixed(1)}% pending
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {viewType === 'chart' ? (
                  <div className="space-y-6">
                    {reportData && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Fee Collection Status</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Collected', value: reportData.fee_summary.collected_fees },
                                  { name: 'Pending', value: reportData.fee_summary.pending_fees }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                              </Pie>
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Fee Types Breakdown</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.student_fees.reduce((acc: any[], fee) => {
                              const existing = acc.find(item => item.type === fee.fee_type_display);
                              if (existing) {
                                existing.amount += fee.total_amount;
                                existing.count += 1;
                              } else {
                                acc.push({
                                  type: fee.fee_type_display,
                                  amount: fee.total_amount,
                                  count: 1
                                });
                              }
                              return acc;
                            }, [])}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="type" />
                              <YAxis />
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                              <Bar dataKey="amount" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <DataTable
                    columns={[
                      { 
                        accessorKey: "student",
                        header: "Student",
                        cell: ({ row }) => {
                          const student = row.original.student;
                          return `${student.first_name} ${student.last_name} (${student.student_id})`;
                        }
                      },
                      { accessorKey: "fee_type_display", header: "Fee Type" },
                      { 
                        accessorKey: "total_amount", 
                        header: "Total Amount",
                        cell: ({ row }) => `₹${row.getValue<number>("total_amount").toLocaleString()}`
                      },
                      { 
                        accessorKey: "paid_amount", 
                        header: "Paid Amount",
                        cell: ({ row }) => (
                          <span className="text-green-600">₹{row.getValue<number>("paid_amount").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "pending_amount", 
                        header: "Pending Amount",
                        cell: ({ row }) => (
                          <span className="text-orange-600">₹{row.getValue<number>("pending_amount").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "status_display",
                        header: "Status",
                        cell: ({ row }) => {
                          const status = row.original.status;
                          return (
                            <Badge variant={
                              status === 'PAID' ? 'default' : 
                              status === 'OVERDUE' ? 'destructive' : 
                              status === 'PARTIAL' ? 'secondary' : 'outline'
                            }>
                              {row.getValue("status_display")}
                            </Badge>
                          );
                        }
                      },
                      { accessorKey: "due_date", header: "Due Date" },
                    ]}
                    data={reportData?.student_fees || []}
                    searchColumn="student"
                    searchPlaceholder="Search students..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Salaries Tab */}
          <TabsContent value="salaries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Staff Salary Report</CardTitle>
                  <CardDescription>
                    Salary payment status for {periodOptions.find(p => p.value === selectedPeriod)?.label}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportSalaries('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportSalaries('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Salary Summary Cards */}
                {reportData && (
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportData.salary_summary.staff_count}</div>
                        <p className="text-xs text-muted-foreground">
                          {reportData.salary_summary.paid_staff} paid, {reportData.salary_summary.pending_staff} pending
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Paid Salaries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{reportData.salary_summary.paid_salaries.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {((reportData.salary_summary.paid_salaries / reportData.salary_summary.total_salaries) * 100).toFixed(1)}% paid
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Salaries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">₹{reportData.salary_summary.pending_salaries.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          {((reportData.salary_summary.pending_salaries / reportData.salary_summary.total_salaries) * 100).toFixed(1)}% pending
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {viewType === 'chart' ? (
                  <div className="space-y-6">
                    {reportData && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Salary Payment Status</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Paid', value: reportData.salary_summary.paid_salaries },
                                  { name: 'Pending', value: reportData.salary_summary.pending_salaries }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                              </Pie>
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Staff Salary Distribution</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.staff_salaries.map(salary => ({
                              name: `${salary.staff.first_name} ${salary.staff.last_name}`,
                              amount: salary.final_amount
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                              <Bar dataKey="amount" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <DataTable
                    columns={[
                      { 
                        accessorKey: "staff",
                        header: "Staff",
                        cell: ({ row }) => {
                          const staff = row.original.staff;
                          return `${staff.first_name} ${staff.last_name} (${staff.staff_id})`;
                        }
                      },
                      { 
                        accessorKey: "base_amount", 
                        header: "Base Amount",
                        cell: ({ row }) => `₹${row.getValue<number>("base_amount").toLocaleString()}`
                      },
                      { 
                        accessorKey: "deductions", 
                        header: "Deductions",
                        cell: ({ row }) => (
                          <span className="text-red-600">₹{row.getValue<number>("deductions").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "bonuses", 
                        header: "Bonuses",
                        cell: ({ row }) => (
                          <span className="text-green-600">₹{row.getValue<number>("bonuses").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "final_amount", 
                        header: "Final Amount",
                        cell: ({ row }) => `₹${row.getValue<number>("final_amount").toLocaleString()}`
                      },
                      { 
                        accessorKey: "paid_amount", 
                        header: "Paid Amount",
                        cell: ({ row }) => (
                          <span className="text-green-600">₹{row.getValue<number>("paid_amount").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "pending_amount", 
                        header: "Pending Amount",
                        cell: ({ row }) => (
                          <span className="text-orange-600">₹{row.getValue<number>("pending_amount").toLocaleString()}</span>
                        )
                      },
                      { 
                        accessorKey: "status_display",
                        header: "Status",
                        cell: ({ row }) => {
                          const status = row.original.status;
                          return (
                            <Badge variant={
                              status === 'PAID' ? 'default' : 
                              status === 'OVERDUE' ? 'destructive' : 
                              status === 'PARTIAL' ? 'secondary' : 'outline'
                            }>
                              {row.getValue("status_display")}
                            </Badge>
                          );
                        }
                      },
                      { accessorKey: "month_year", header: "Month/Year" },
                    ]}
                    data={reportData?.staff_salaries || []}
                    searchColumn="staff"
                    searchPlaceholder="Search staff..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}