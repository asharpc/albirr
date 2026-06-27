import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, DollarSign, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

import {
  Transaction,
  StudentFee,
  StaffSalary,
  FinanceSummary,
  PaginatedResponse
} from "@/types";

// Import forms (we'll create these components)
import AddFeePaymentForm from "./components/AddFeePaymentForm";
import AddSalaryPaymentForm from "./components/AddSalaryPaymentForm";
import AddExpenseForm from "./components/AddExpenseForm";
import AddExpenseTypeForm from "./components/AddExpenseTypeForm";

export default function FinancesPage() {
  const navigate = useNavigate();

  // API queries
  const { data: financeSummary } = useQuery<FinanceSummary>({
    queryKey: ["finance-summary"],
    queryFn: () => api.get("/transactions/summary/").then(res => res.data),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["transactions"],
    queryFn: () => api.get("/transactions/?page_size=10").then(res => res.data),
  });

  const transactions = transactionsData?.results || [];

  const { data: pendingFeesData, isLoading: feesLoading } = useQuery<PaginatedResponse<StudentFee> | StudentFee[]>({
    queryKey: ["student-fees", "pending"],
    queryFn: () => api.get("/student-fees/pending/").then(res => res.data),
  });

  const { data: pendingSalariesData, isLoading: salariesLoading } = useQuery<PaginatedResponse<StaffSalary> | StaffSalary[]>({
    queryKey: ["staff-salaries", "pending"],
    queryFn: () => api.get("/staff-salaries/pending/").then(res => res.data),
  });

  const pendingFees = Array.isArray(pendingFeesData) ? pendingFeesData : (pendingFeesData?.results || []);
  const pendingSalaries = Array.isArray(pendingSalariesData) ? pendingSalariesData : (pendingSalariesData?.results || []);


  // Transaction columns
  const transactionColumns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "transaction_date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.getValue("transaction_date")).toLocaleDateString(),
    },
    {
      accessorKey: "category_display",
      header: "Category",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className={row.original.transaction_type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
          ₹{row.getValue<number>("amount").toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "transaction_type_display",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.transaction_type === 'INCOME' ? "default" : "destructive"}>
          {row.getValue("transaction_type_display")}
        </Badge>
      ),
    },
    {
      id: "related_entity",
      header: "Related To",
      cell: ({ row }) => {
        const entity = row.original.related_entity;
        return <span className="text-sm text-muted-foreground">{entity.name}</span>;
      },
    },
  ];

  // Student Fee columns
  const feeColumns: ColumnDef<StudentFee>[] = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.getValue("student") as any;
        return `${student.first_name} ${student.last_name}`;
      },
    },
    {
      accessorKey: "fee_type_display",
      header: "Fee Type",
    },
    {
      accessorKey: "month_year",
      header: "Month/Year",
      cell: ({ row }) => row.getValue("month_year") || "N/A",
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => `₹${row.getValue<number>("total_amount").toLocaleString()}`,
    },
    {
      accessorKey: "pending_amount",
      header: "Pending",
      cell: ({ row }) => (
        <span className="text-red-600">
          ₹{row.getValue<number>("pending_amount").toLocaleString()}
        </span>
      ),
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
      },
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => new Date(row.getValue("due_date")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AddFeePaymentForm studentFee={row.original}>
            <Button size="sm" variant="outline">
              <DollarSign className="h-3 w-3 mr-1" />
              Pay
            </Button>
          </AddFeePaymentForm>
        </div>
      ),
    },
  ];

  // Staff Salary columns
  const salaryColumns: ColumnDef<StaffSalary>[] = [
    {
      accessorKey: "staff",
      header: "Staff",
      cell: ({ row }) => {
        const staff = row.getValue("staff") as any;
        return `${staff.first_name} ${staff.last_name}`;
      },
    },
    {
      accessorKey: "month_year",
      header: "Month/Year",
    },
    {
      accessorKey: "final_amount",
      header: "Final Amount",
      cell: ({ row }) => `₹${row.getValue<number>("final_amount").toLocaleString()}`,
    },
    {
      accessorKey: "pending_amount",
      header: "Pending",
      cell: ({ row }) => (
        <span className="text-red-600">
          ₹{row.getValue<number>("pending_amount").toLocaleString()}
        </span>
      ),
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
      },
    },
    {
      accessorKey: "pay_date",
      header: "Pay Date",
      cell: ({ row }) => new Date(row.getValue("pay_date")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <AddSalaryPaymentForm staffSalary={row.original}>
            <Button size="sm" variant="outline">
              <DollarSign className="h-3 w-3 mr-1" />
              Pay
            </Button>
          </AddSalaryPaymentForm>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Finance Management</h2>
          <div className="flex gap-2">
            <AddExpenseForm>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </AddExpenseForm>
            <AddExpenseTypeForm>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Expense Type
              </Button>
            </AddExpenseTypeForm>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{financeSummary?.total_income?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{financeSummary?.total_expenses?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (financeSummary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{financeSummary?.net_balance?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₹{((financeSummary?.pending_fees || 0) + (financeSummary?.pending_salaries || 0)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(financeSummary?.students_with_pending_fees || 0)} students, {(financeSummary?.staff_with_pending_salaries || 0)} staff
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fees">Student Fees</TabsTrigger>
            <TabsTrigger value="salaries">Staff Salaries</TabsTrigger>
            <TabsTrigger value="expenses">Other Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div>Loading transactions...</div>
                ) : (
                  <DataTable
                    columns={transactionColumns}
                    data={transactions}
                    searchColumn="description"
                    searchPlaceholder="Search transactions..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Student Fees</CardTitle>
                <Button onClick={() => navigate("/finances/add-fee")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fee
                </Button>
              </CardHeader>
              <CardContent>
                {feesLoading ? (
                  <div>Loading fees...</div>
                ) : (
                  <DataTable
                    columns={feeColumns}
                    data={pendingFees || []}
                    searchColumn="student"
                    searchPlaceholder="Search students..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salaries">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Staff Salaries</CardTitle>
                <Button onClick={() => navigate("/finances/add-salary")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Salary
                </Button>
              </CardHeader>
              <CardContent>
                {salariesLoading ? (
                  <div>Loading salaries...</div>
                ) : (
                  <DataTable
                    columns={salaryColumns}
                    data={pendingSalaries || []}
                    searchColumn="staff"
                    searchPlaceholder="Search staff..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Other Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={transactionColumns}
                  data={transactions.filter(t => t.transaction_type === 'EXPENSE' && t.category === 'OTHER_EXPENSE')}
                  searchColumn="description"
                  searchPlaceholder="Search expenses..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}