import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Mail, Phone, UserCheck, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Staff, SalaryPayment, PaginatedResponse } from "@/types";

const StaffDetail = () => {
  const { id } = useParams<{ id: string }>();

  // Staff query
  const { data: staff, isLoading, error } = useQuery<Staff>({
    queryKey: ["staff", id],
    queryFn: async () => {
      const response = await api.get(`/staff/${id}/`);
      return response.data;
    },
  });

  // Salary payments query
  const { data: salaryPayments, isLoading: isLoadingSalaries } = useQuery<PaginatedResponse<SalaryPayment>>({
    queryKey: ["salary-payments", id],
    queryFn: async () => {
      const response = await api.get(`/salary-payments/?staff=${id}&page_size=10`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Loading staff details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !staff) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <p className="text-sm text-destructive">Error loading staff details.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Staff Details
        </h2>

        {/* Basic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Staff member profile details
              </CardDescription>
            </div>
            <Users className="h-4 w-4 text-school-purple" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  {staff.profile_image ? (
                    <AvatarImage src={staff.profile_image} alt={`${staff.first_name} ${staff.last_name}`} />
                  ) : (
                    <AvatarFallback className="bg-school-purple-light text-school-purple text-lg font-semibold">
                      {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              {/* Staff Name and Basic Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">
                  {staff.first_name} {staff.last_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">Staff ID: {staff.staff_id || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Role: {staff.role?.name || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Staff ID", value: staff.staff_id || 'N/A', icon: UserCheck },
                { label: "First Name", value: staff.first_name },
                { label: "Last Name", value: staff.last_name },
                { label: "Email", value: staff.email, icon: Mail },
                { label: "Phone", value: staff.phone, icon: Phone },
                { label: "Hire Date", value: new Date(staff.hire_date).toLocaleDateString(), icon: Calendar },
              ].map((item, index) => (
                <div key={index} className={item.label === "Email" ? "md:col-span-2 lg:col-span-2" : ""}>
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-3 w-3 text-muted-foreground" />}
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Role Information</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Staff member role and responsibilities
              </CardDescription>
            </div>
            <UserCheck className="h-4 w-4 text-school-blue" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff.role ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-school-green">
                      {staff.role.name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Role Description</p>
                    <p className="text-xs text-muted-foreground">{staff.role.description || "No description available"}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Badge variant="outline" className="text-muted-foreground">
                    No Role Assigned
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">This staff member has not been assigned a role yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Employment Details</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Employment history and dates
              </CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-school-orange" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Hire Date</p>
                <p className="text-xs text-muted-foreground">{new Date(staff.hire_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Employment Duration</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor((new Date().getTime() - new Date(staff.hire_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Created At</p>
                <p className="text-xs text-muted-foreground">{new Date(staff.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Last Updated</p>
                <p className="text-xs text-muted-foreground">{new Date(staff.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Management Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Salary Management</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Staff salary records and payment history
              </CardDescription>
            </div>
            <DollarSign className="h-4 w-4 text-school-green" />
          </CardHeader>
          <CardContent>
            {isLoadingSalaries ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Loading salary payments...</p>
              </div>
            ) : salaryPayments?.results && salaryPayments.results.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Month/Year</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryPayments.results.slice(0, 5).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.staff_salary.month_year}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          ₹{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_method_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge 
                            variant={payment.staff_salary.status === 'PAID' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {payment.staff_salary.status_display}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {salaryPayments.results.length > 5 && (
                  <div className="text-center pt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/finances?tab=salaries&staff=${id}`}>
                        View All Salary Payments ({salaryPayments.count} total)
                      </Link>
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Recent salary payments • Total: {salaryPayments.count} payments
                  </p>
                  <Button asChild size="sm">
                    <Link to={`/finances/add-salary?staff=${id}`}>
                      Add Salary Payment
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No salary payments recorded yet for this staff member.
                </p>
                <Button asChild size="sm">
                  <Link to={`/finances/add-salary?staff=${id}`}>
                    Add First Salary Payment
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Common tasks for this staff member
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to={`/staff/edit/${id}`}>Edit Staff Member</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to="/staff">Back to Staff</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffDetail;