import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Role, Staff, PaginatedResponse } from "@/types";

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id?: string;
  hire_date: string;
}

interface EditStaffFormProps {
  staff: Staff;
  onSubmit: (staff: FormData) => void;
}

const EditStaffForm = ({ staff, onSubmit }: EditStaffFormProps) => {
  const { toast } = useToast();

  const methods = useForm<FormData>({
    defaultValues: {
      first_name: staff.first_name || "",
      last_name: staff.last_name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      role_id: staff.role?.id || "",
      hire_date: staff.hire_date ? staff.hire_date.split('T')[0] : "",
    },
  });

  // Fetch roles for the dropdown
  const { data: rolesData } = useQuery<PaginatedResponse<Role> | Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles/").then(res => res.data),
  });

  const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.results || []);

  const handleSubmit = (data: FormData) => {
    // Remove empty role_id if not selected
    if (!data.role_id) {
      delete data.role_id;
    }
    onSubmit(data);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Edit Staff Member</h2>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">First Name</FormLabel>
            <FormControl>
              <Input
                {...methods.register("first_name", { required: "First name is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
          
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Last Name</FormLabel>
            <FormControl>
              <Input
                {...methods.register("last_name", { required: "Last name is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>

          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Email</FormLabel>
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
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>

          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Phone</FormLabel>
            <FormControl>
              <Input
                {...methods.register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^\+?\d{10,15}$/,
                    message: "Invalid phone number",
                  },
                })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>

          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Role</FormLabel>
            <FormControl>
              <Select
                defaultValue={staff.role?.id || ""}
                onValueChange={(value) => methods.setValue("role_id", value)}
              >
                <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm">
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>

          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Hire Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...methods.register("hire_date", { required: "Hire date is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>

          <FormItem className="md:col-span-3">
            <Button
              type="submit"
              className="w-full text-white font-semibold py-2 rounded-lg transition-all duration-200"
            >
              Save Changes
            </Button>
          </FormItem>
        </form>
      </FormProvider>
    </div>
  );
};

export default EditStaffForm;