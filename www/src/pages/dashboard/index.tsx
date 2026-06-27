import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Target,
  Activity,
  BarChart3,
  UserPlus,
  Receipt,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { DashboardStats } from "@/types";

export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/transactions/dashboard_stats/").then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = dashboardStats || {} as DashboardStats;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your institution.
            </p>
          </div>
          <div className="flex gap-2">
            {stats.overdue_fees_alert && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue Fees
              </Badge>
            )}
            {stats.overdue_salaries_alert && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue Salaries
              </Badge>
            )}
            {stats.low_collection_alert && (
              <Badge variant="secondary" className="gap-1">
                <Target className="h-3 w-3" />
                Low Collection Rate
              </Badge>
            )}
          </div>
        </div>
        
        {/* Main Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recent_student_admissions || 0} this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_staff || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recent_staff_additions || 0} this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.current_month_income?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ₹{stats.current_month_expenses?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month expenses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monthly Balance
              </CardTitle>
              <CardDescription>Current month profit/loss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                (stats.current_month_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{stats.current_month_balance?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {(stats.current_month_balance || 0) >= 0 ? "Profit" : "Loss"} for this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Fee Collection Rate
              </CardTitle>
              <CardDescription>Overall collection performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(stats.fee_collection_rate || 0).toFixed(1)}%</div>
              <Progress value={stats.fee_collection_rate || 0} className="mt-3" />
              <p className="text-sm text-muted-foreground mt-2">
                ₹{stats.total_pending_fees?.toLocaleString() || '0'} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Salary Payment Rate
              </CardTitle>
              <CardDescription>Salary disbursement performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(stats.salary_payment_rate || 0).toFixed(1)}%</div>
              <Progress value={stats.salary_payment_rate || 0} className="mt-3" />
              <p className="text-sm text-muted-foreground mt-2">
                ₹{stats.total_pending_salaries?.toLocaleString() || '0'} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.total_fee_collections_today?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Fee payments received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Payments</CardTitle>
              <Wallet className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.total_salary_payments_today?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Salary payments made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_transactions_count || 0}</div>
              <p className="text-xs text-muted-foreground">Transactions this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Fee Amount</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.average_fee_amount?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Per student</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items & Alerts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Pending Fees
              </CardTitle>
              <CardDescription>Students with outstanding payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-2xl font-bold">{stats.students_with_pending_fees || 0}</div>
                  <span className="text-sm text-muted-foreground">
                    {stats.students_with_overdue_fees || 0} overdue
                  </span>
                </div>
                <Button size="sm" asChild>
                  <Link to="/finances?tab=fees">View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Pending Salaries
              </CardTitle>
              <CardDescription>Staff with pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-2xl font-bold">{stats.staff_with_pending_salaries || 0}</div>
                  <span className="text-sm text-muted-foreground">
                    {stats.staff_with_overdue_salaries || 0} overdue
                  </span>
                </div>
                <Button size="sm" asChild>
                  <Link to="/finances?tab=salaries">View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                Staff Without Roles
              </CardTitle>
              <CardDescription>Staff members needing role assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-2xl font-bold">{stats.staff_without_roles || 0}</div>
                  <span className="text-sm text-muted-foreground">require assignment</span>
                </div>
                <Button size="sm" asChild>
                  <Link to="/staff">Assign Roles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/students/add">Add New Student</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/staff/add">Add New Staff</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/finances/add-fee">Record Fee Payment</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/finances/add-salary">Record Salary</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/finances">Financial Overview</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/reports">Generate Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}