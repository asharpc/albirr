import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { StaffSalary } from "@/types";

interface FormData {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  reference_image?: FileList;
  notes: string;
}

interface Props {
  staffSalary: StaffSalary;
  children: React.ReactNode;
}

const AddSalaryPaymentForm = ({ staffSalary, children }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const methods = useForm<FormData>({
    defaultValues: {
      amount: staffSalary.pending_amount,
      payment_method: "",
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const formData = new window.FormData();
      formData.append('amount', data.amount.toString());
      formData.append('payment_method', data.payment_method);
      formData.append('payment_date', data.payment_date);
      formData.append('reference_number', data.reference_number);
      formData.append('notes', data.notes);
      formData.append('staff_salary_id', staffSalary.id);
      
      if (data.reference_image && data.reference_image.length > 0) {
        formData.append('reference_image', data.reference_image[0]);
      }
      
      return api.post("/salary-payments/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Success",
        description: "Salary payment recorded successfully.",
      });
      setOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again.",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const paymentMethods = [
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CASH", label: "Cash" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Salary Payment</DialogTitle>
          <DialogDescription>
            Record salary payment for {staffSalary.staff.first_name} {staffSalary.staff.last_name} - {staffSalary.month_year}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...methods.register("amount", {
                      required: "Amount is required",
                      min: { value: 0.01, message: "Amount must be greater than 0" },
                      max: { value: staffSalary.pending_amount, message: "Amount cannot exceed pending amount" },
                    })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <FormControl>
                  <Select onValueChange={(value) => methods.setValue("payment_method", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Payment Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...methods.register("payment_date", { required: "Payment date is required" })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Reference Number</FormLabel>
                <FormControl>
                  <Input
                    {...methods.register("reference_number")}
                    placeholder="Transaction/Reference number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Reference Image</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  {...methods.register("reference_image")}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Upload a screenshot or photo of the payment receipt (optional)
              </p>
            </FormItem>

            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...methods.register("notes")}
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddSalaryPaymentForm;