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
import { Staff, PaginatedResponse } from "@/types";

interface FormData {
  staff_id: string;
  base_amount: number;
  deductions: number;
  bonuses: number;
  month_year: string;
  pay_date: string;
  notes: string;
}

export default function AddSalaryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pre-select staff if coming from staff detail page
  const preSelectedStaffId = searchParams.get("staff");

  const methods = useForm<FormData>({
    defaultValues: {
      staff_id: preSelectedStaffId || "",
      base_amount: 0,
      deductions: 0,
      bonuses: 0,
      month_year: "",
      pay_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Fetch staff for dropdown
  const { data: staffData } = useQuery<PaginatedResponse<Staff> | Staff[]>({
    queryKey: ["staff"],
    queryFn: () => api.get("/staff/").then(res => res.data),
  });

  const staff = Array.isArray(staffData) ? staffData : (staffData?.results || []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        status: 'PENDING',
        paid_amount: 0,
      };
      return api.post("/staff-salaries/", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Success",
        description: "Staff salary added successfully.",
      });
      navigate("/finances?tab=salaries");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add salary. Please try again.",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

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
            <CardTitle>Add Staff Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Staff Member</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => methods.setValue("staff_id", value)}
                        defaultValue={preSelectedStaffId || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff?.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={String(staffMember.id)}>
                              {staffMember.first_name} {staffMember.last_name} ({staffMember.staff_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Month/Year</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => methods.setValue("month_year", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month/year for salary" />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormItem>
                    <FormLabel>Base Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...methods.register("base_amount", {
                          required: "Base amount is required",
                          min: { value: 0.01, message: "Amount must be greater than 0" },
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Deductions (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...methods.register("deductions", {
                          min: { value: 0, message: "Deductions cannot be negative" },
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Bonuses (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...methods.register("bonuses", {
                          min: { value: 0, message: "Bonuses cannot be negative" },
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <FormItem>
                  <FormLabel>Pay Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...methods.register("pay_date", { required: "Pay date is required" })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...methods.register("notes")}
                      placeholder="Additional notes about this salary (optional)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/finances?tab=salaries")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Adding..." : "Add Salary"}
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