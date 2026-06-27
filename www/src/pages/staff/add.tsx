import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ImageUpload } from "@/components/ui/image-upload";
import { useState } from "react";
import api from "@/lib/api";
import { Role, PaginatedResponse } from "@/types";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id?: string;
  hire_date: string;
}

const AddStaffForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const methods = useForm<FormData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role_id: "",
      hire_date: "",
    },
  });

  // Fetch roles for the dropdown
  const { data: rolesData } = useQuery<PaginatedResponse<Role> | Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles/").then(res => res.data),
  });

  const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.results || []);

  const mutation = useMutation({
    mutationFn: async (newStaff: FormData) => {
      const formData = new FormData();
      
      // Append all staff data
      Object.entries(newStaff).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      
      // Append profile image if exists
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }
      
      return api.post("/staff/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Success",
        description: "Staff member added successfully.",
      });
      navigate("/staff");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error === "Email not verified. Please verify your email."
          ? "Email not verified. Please verify your email."
          : "Failed to add staff member. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    // Remove empty role_id if not selected
    if (!data.role_id) {
      delete data.role_id;
    }
    mutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Add New Staff Member</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Fill in the staff member information below</p>
          </div>
          <div className="p-4 md:p-6">
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Profile Image Section */}
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-foreground border-b border-border pb-2">
                    Profile Image
                  </h3>
                  <ImageUpload
                    value={profileImage}
                    onChange={setProfileImage}
                    placeholder="Upload staff profile image"
                  />
                </div>

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-foreground border-b border-border pb-2">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        First Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("first_name", { required: "First name is required" })}
                          placeholder="Enter first name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Last Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("last_name", { required: "Last name is required" })}
                          placeholder="Enter last name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...methods.register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: "Invalid email address",
                            },
                          })}
                          placeholder="Enter email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("phone", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^\+?\d{10,15}$/,
                              message: "Invalid phone number",
                            },
                          })}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>

                {/* Employment Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-foreground border-b border-border pb-2">
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Role</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => methods.setValue("role_id", value)}
                          value={methods.watch("role_id")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Hire Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...methods.register("hire_date", { required: "Hire date is required" })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/staff")}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {mutation.isPending ? "Adding..." : "Add Staff Member"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddStaffForm;