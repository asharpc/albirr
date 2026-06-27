import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface EditStudentFormProps {
  student: FormData;
  onSubmit: (student: FormData) => void;
}

const EditStudentForm = ({ student, onSubmit }: EditStudentFormProps) => {
  const { toast } = useToast();

  const methods = useForm<FormData>({
    defaultValues: {
      student_id: student.student_id || "",
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      mothor_name: student.mothor_name || "",
      father_name: student.father_name || "",
      parent_phone_primary: student.parent_phone_primary || "",
      parent_phone_secondary: student.parent_phone_secondary || "",
      address: student.address || "",
      email: student.email || "",
      whatsapp_phone: student.whatsapp_phone || "",
      grade_level: student.grade_level || "",
      joined_date: student.joined_date || "",
    },
  });


  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <div className="mx-auto max-w-5xl p-4 bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Edit Student</h2>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Student ID</FormLabel>
            <FormControl>
              <Input
                {...methods.register("student_id", { required: "Student ID is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
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
            <FormLabel className="text-gray-700 text-sm font-medium">Mother's Name</FormLabel>
            <FormControl>
              <Input
                {...methods.register("mothor_name", { required: "Mother's name is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Father's Name</FormLabel>
            <FormControl>
              <Input
                {...methods.register("father_name", { required: "Father's name is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Primary Phone</FormLabel>
            <FormControl>
              <Input
                {...methods.register("parent_phone_primary", {
                  required: "Primary phone is required",
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
            <FormLabel className="text-gray-700 text-sm font-medium">Secondary Phone</FormLabel>
            <FormControl>
              <Input
                {...methods.register("parent_phone_secondary", {
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
            <FormLabel className="text-gray-700 text-sm font-medium">WhatsApp Phone</FormLabel>
            <FormControl>
              <Input
                {...methods.register("whatsapp_phone", {
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
          <FormItem className="md:col-span-3">
            <FormLabel className="text-gray-700 text-sm font-medium">Address</FormLabel>
            <FormControl>
              <Input
                {...methods.register("address", { required: "Address is required" })}
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
            <FormLabel className="text-gray-700 text-sm font-medium">Grade Level</FormLabel>
            <FormControl>
              <Input
                {...methods.register("grade_level", { required: "Grade level is required" })}
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
              />
            </FormControl>
            <FormMessage className="text-red-500 text-xs" />
          </FormItem>
          <FormItem>
            <FormLabel className="text-gray-700 text-sm font-medium">Joined Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...methods.register("joined_date", { required: "Joined date is required" })}
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

export default EditStudentForm;