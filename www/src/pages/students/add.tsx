import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ImageUpload } from "@/components/ui/image-upload";
import { useState } from "react";
import api from "@/lib/api";

interface FormData {
  student_id: string;
  first_name: string;
  last_name: string;
  mothor_name: string;
  father_name: string;
  parent_phone_primary: string;
  parent_phone_secondary: string;
  address: string;
  email: string;
  whatsapp_phone: string;
  grade_level: string;
  joined_date: string;
}

interface AddStudentFormProps {
  onSubmit?: (student: any) => void;
  isModal?: boolean;
}

const AddStudentForm = ({ onSubmit, isModal = false }: AddStudentFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const methods = useForm<FormData>({
    defaultValues: {
      student_id: "",
      first_name: "",
      last_name: "",
      mothor_name: "",
      father_name: "",
      parent_phone_primary: "",
      parent_phone_secondary: "",
      address: "",
      email: "",
      whatsapp_phone: "",
      grade_level: "",
      joined_date: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (newStudent: FormData) => {
      const formData = new FormData();
      
      // Append all student data
      Object.entries(newStudent).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Append profile image if exists
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }
      
      return api.post("/student/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({
        title: "Success",
        description: "Student added successfully.",
      });
      if (isModal && onSubmit) {
        onSubmit(data);
      } else {
        navigate("/students");
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error === "Email not verified. Please verify your email."
          ? "Email not verified. Please verify your email."
          : "Failed to add student. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const formContent = (
    <div className={`${isModal ? 'w-full' : 'w-full max-w-4xl mx-auto'}`}>
      <div className={`${isModal ? '' : 'bg-card rounded-lg border border-border shadow-sm'}`}>
        {!isModal && (
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Add New Student</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Fill in the student information below</p>
          </div>
        )}
        <div className={`${isModal ? 'space-y-4' : 'p-4 md:p-6'}`}>
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
                    placeholder="Upload student profile image"
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
                        Student ID <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("student_id", { required: "Student ID is required" })}
                          placeholder="Enter student ID"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
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
                        Mother's Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("mothor_name", { required: "Mother's name is required" })}
                          placeholder="Enter mother's name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Father's Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("father_name", { required: "Father's name is required" })}
                          placeholder="Enter father's name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Grade Level <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("grade_level", { required: "Grade level is required" })}
                          placeholder="Enter grade level"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Joined Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...methods.register("joined_date", { required: "Joined date is required" })}
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
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-foreground border-b border-border pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Primary Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("parent_phone_primary", {
                            required: "Primary phone is required",
                            pattern: {
                              value: /^\+?\d{10,15}$/,
                              message: "Invalid phone number",
                            },
                          })}
                          placeholder="Enter primary phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Secondary Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("parent_phone_secondary", {
                            pattern: {
                              value: /^\+?\d{10,15}$/,
                              message: "Invalid phone number",
                            },
                          })}
                          placeholder="Enter secondary phone number (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">WhatsApp Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("whatsapp_phone", {
                            pattern: {
                              value: /^\+?\d{10,15}$/,
                              message: "Invalid phone number",
                            },
                          })}
                          placeholder="Enter WhatsApp phone number (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...methods.register("address", { required: "Address is required" })}
                          placeholder="Enter full address"
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
                    onClick={() => {
                      if (isModal && onSubmit) {
                        onSubmit(null);
                      } else {
                        navigate("/students");
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {mutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </div>
              </form>
            </FormProvider>
        </div>
      </div>
    </div>
  );

  return isModal ? formContent : (
    <DashboardLayout>
      {formContent}
    </DashboardLayout>
  );
};

export default AddStudentForm;