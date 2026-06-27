import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CreditCard, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Fee {
  amount: number;
  isPaid: boolean;
  pendingAmount: number;
  createdAt: string;
}

interface Student {
  id: string;
  tenant_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  mother_name: string;
  father_name: string;
  parent_phone_primary: string;
  parent_phone_secondary: string;
  address: string;
  email: string;
  whatsapp_phone: string;
  grade_level: string;
  joined_date: string;
  profile_image?: string;
  admissionFee?: Fee;
  monthlyFees?: { [month: string]: Fee };
  otherFees?: { [type: string]: Fee };
  amenities?: { name: string; available: boolean; fee?: number }[];
}

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();

  // Student query
  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ["student", id],
    queryFn: async () => {
      const response = await api.get(`/student/${id}/`);
      return response.data;
    },
  });


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Loading student details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <p className="text-sm text-destructive">Error loading student details.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Student Details
        </h2>

        {/* Basic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Student profile details
              </CardDescription>
            </div>
            <GraduationCap className="h-4 w-4 text-school-purple" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  {student.profile_image ? (
                    <AvatarImage src={student.profile_image} alt={`${student.first_name} ${student.last_name}`} />
                  ) : (
                    <AvatarFallback className="bg-school-purple-light text-school-purple text-lg font-semibold">
                      {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              {/* Student Name and Basic Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">
                  {student.first_name} {student.last_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">Student ID: {student.student_id}</p>
                <p className="text-sm text-muted-foreground">Grade: {student.grade_level}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Tenant ID", value: student.tenant_id },
                { label: "Student ID", value: student.student_id },
                { label: "First Name", value: student.first_name },
                { label: "Last Name", value: student.last_name },
                { label: "Mother's Name", value: student.mother_name },
                { label: "Father's Name", value: student.father_name },
                { label: "Primary Phone", value: student.parent_phone_primary },
                { label: "Secondary Phone", value: student.parent_phone_secondary || "N/A" },
                { label: "WhatsApp Phone", value: student.whatsapp_phone || "N/A" },
                { label: "Email", value: student.email },
                { label: "Grade Level", value: student.grade_level },
                { label: "Joined Date", value: student.joined_date },
              ].map((item, index) => (
                <div key={index} className={item.label === "Email" ? "md:col-span-2 lg:col-span-4" : ""}>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
              ))}
              <div className="md:col-span-2 lg:col-span-4">
                <p className="text-sm font-medium text-foreground">Address</p>
                <p className="text-xs text-muted-foreground">{student.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Payment History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Payment History</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                View all fee payments and statuses
              </CardDescription>
            </div>
            <CheckCircle className="h-4 w-4 text-school-orange" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Month/Type</TableHead>
                  <TableHead className="text-xs">Amount (₹)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.admissionFee && (
                  <TableRow>
                    <TableCell className="text-xs">Admission</TableCell>
                    <TableCell className="text-xs">-</TableCell>
                    <TableCell className="text-xs">₹{student.admissionFee.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={student.admissionFee.isPaid ? "default" : "destructive"} className={student.admissionFee.isPaid ? "bg-school-green" : ""}>
                        {student.admissionFee.isPaid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{student.admissionFee.createdAt}</TableCell>
                  </TableRow>
                )}
                {student.monthlyFees &&
                  Object.entries(student.monthlyFees).map(([month, fee]) => (
                    <TableRow key={month}>
                      <TableCell className="text-xs">Monthly</TableCell>
                      <TableCell className="text-xs">{month}</TableCell>
                      <TableCell className="text-xs">₹{fee.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={fee.isPaid ? "default" : "destructive"} className={fee.isPaid ? "bg-school-green" : ""}>
                          {fee.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{fee.createdAt}</TableCell>
                    </TableRow>
                  ))}
                {student.otherFees &&
                  Object.entries(student.otherFees).map(([type, fee]) => (
                    <TableRow key={type}>
                      <TableCell className="text-xs">Other</TableCell>
                      <TableCell className="text-xs">{type}</TableCell>
                      <TableCell className="text-xs">₹{fee.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={fee.isPaid ? "default" : "destructive"} className={fee.isPaid ? "bg-school-green" : ""}>
                          {fee.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{fee.createdAt}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {(student.admissionFee || student.monthlyFees || student.otherFees) ? null : (
              <p className="text-xs text-muted-foreground mt-4">No payment history available</p>
            )}
          </CardContent>
        </Card>

        {/* Fee Management Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Fee Management</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Student fee records and payment history
              </CardDescription>
            </div>
            <CreditCard className="h-4 w-4 text-school-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Fee management has been moved to the new Finance section for better tracking and reporting.
              </p>
              <Button asChild size="sm">
                <Link to="/finances?tab=fees&student=${id}">
                  View Student Fees
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Common tasks for this student
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to={`/students/${id}/edit`}>Edit Student</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to={`/finances/add-fee?student=${id}`}>Record Fee Payment</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to="/students">Back to Students</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDetail;