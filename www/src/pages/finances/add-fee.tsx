import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Student, PaginatedResponse } from "@/types";

interface FormData {
  student_id: string;
  fee_type: string;
  total_amount: number;
  due_date: string;
  month_year?: string;
  description: string;
}

export default function AddFeePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeeType, setSelectedFeeType] = useState("");

  // Pre-select student if coming from student detail page
  const preSelectedStudentId = searchParams.get("student");

  const methods = useForm<FormData>({
    defaultValues: {
      student_id: preSelectedStudentId || "",
      fee_type: "",
      total_amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      month_year: "",
      description: "",
    },
  });

  // Fetch students for dropdown
  const { data: studentsData } = useQuery<PaginatedResponse<Student> | Student[]>({
    queryKey: ["students"],
    queryFn: () => api.get("/student/").then(res => res.data),
  });

  const students = Array.isArray(studentsData) ? studentsData : (studentsData?.results || []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        status: 'PENDING',
        paid_amount: 0,
      };
      // Remove empty month_year if not applicable
      if (!payload.month_year) {
        delete payload.month_year;
      }
      return api.post("/student-fees/", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Success",
        description: "Student fee added successfully.",
      });
      navigate("/finances?tab=fees");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add fee. Please try again.",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const feeTypes = [
    { value: "TUITION", label: "Tuition Fee" },
    { value: "ADMISSION", label: "Admission Fee" },
    { value: "AMENITY", label: "Amenity Fee" },
    { value: "OTHER", label: "Other Fee" },
  ];

  // Generate month options for the current and next year
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Add months for current year and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let month = 0; month < 12; month++) {
        const value = `${year}-${String(month + 1).padStart(2, '0')}`;
        const label = `${monthNames[month]} ${year}`;
        months.push({ value, label });
      }
    }
    
    return months;
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Student Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => methods.setValue("student_id", value)}
                        value={methods.watch("student_id")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={String(student.id)}>
                              {student.first_name} {student.last_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          setSelectedFeeType(value);
                          methods.setValue("fee_type", value);
                        }}
                        value={methods.watch("fee_type")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...methods.register("total_amount", {
                          required: "Amount is required",
                          min: { value: 0.01, message: "Amount must be greater than 0" },
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...methods.register("due_date", { required: "Due date is required" })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                {selectedFeeType === "TUITION" && (
                  <FormItem>
                    <FormLabel>Month/Year</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => methods.setValue("month_year", value)}
                        value={methods.watch("month_year")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month/year for tuition" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateMonthOptions().map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}

                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...methods.register("description")}
                      placeholder="Additional details about this fee (optional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/finances?tab=fees")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Adding..." : "Add Fee"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}