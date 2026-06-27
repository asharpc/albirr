import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface FormData {
  name: string;
  description: string;
}

interface Props {
  children: React.ReactNode;
}

const AddExpenseTypeForm = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const methods = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => 
      api.post("/expense-types/", {
        ...data,
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
      toast({
        title: "Success",
        description: "Expense type created successfully.",
      });
      setOpen(false);
      methods.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense type. Please try again.",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense Type</DialogTitle>
          <DialogDescription>
            Create a new expense category for better organization
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...methods.register("name", { 
                    required: "Name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" },
                    maxLength: { value: 100, message: "Name must be less than 100 characters" }
                  })}
                  placeholder="e.g., Utilities, Office Supplies, Maintenance"
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...methods.register("description")}
                  placeholder="Brief description of this expense type (optional)"
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
                {mutation.isPending ? "Creating..." : "Create Expense Type"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseTypeForm;