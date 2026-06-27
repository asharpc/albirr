import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { ExpenseType, PaginatedResponse } from "@/types";

interface FormData {
  amount: number;
  description: string;
  transaction_date: string;
  expense_type_id?: string;
  notes: string;
}

interface Props {
  children: React.ReactNode;
}

const AddExpenseForm = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const methods = useForm<FormData>({
    defaultValues: {
      amount: 0,
      description: "",
      transaction_date: new Date().toISOString().split('T')[0],
      expense_type_id: "",
      notes: "",
    },
  });

  const { data: expenseTypesData } = useQuery<PaginatedResponse<ExpenseType> | ExpenseType[]>({
    queryKey: ["expense-types"],
    queryFn: () => api.get("/expense-types/").then(res => res.data),
  });

  const expenseTypes = Array.isArray(expenseTypesData) ? expenseTypesData : (expenseTypesData?.results || []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => 
      api.post("/transactions/", {
        ...data,
        transaction_type: "EXPENSE",
        category: "OTHER_EXPENSE",
        expense_type_id: data.expense_type_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Success",
        description: "Expense recorded successfully.",
      });
      setOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record expense. Please try again.",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    // Remove empty expense_type_id
    if (!data.expense_type_id) {
      delete data.expense_type_id;
    }
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record a new expense transaction
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
                    })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...methods.register("transaction_date", { required: "Date is required" })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Expense Type</FormLabel>
              <FormControl>
                <Select onValueChange={(value) => methods.setValue("expense_type_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.filter(type => type.is_active).map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  {...methods.register("description", { required: "Description is required" })}
                  placeholder="Brief description of the expense"
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...methods.register("notes")}
                  placeholder="Additional details (optional)"
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
                {mutation.isPending ? "Recording..." : "Record Expense"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseForm;