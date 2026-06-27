import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginatedDataTable } from "@/components/ui/paginated-data-table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import api from "@/lib/api";
import { Student, PaginatedResponse } from "@/types";
import AddStudentForm from "./add";
import EditStudentForm from "./edit";
import StudentDetail from "./StudentDetail";

const StudentsPage = () => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const pagination = usePagination({
    initialPageSize: 20,
  });

  const { data: studentsData, isLoading, error } = useQuery<PaginatedResponse<Student>>({
    queryKey: ["students", pagination.getParams()],
    queryFn: async () => {
      const params = new URLSearchParams();
      const paginationParams = pagination.getParams();
      
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      const response = await api.get(`/student/?${params.toString()}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch students. Please try again.",
      });
    }
  }, [error, toast]);

  const columns: ColumnDef<Student>[] = [
    { accessorKey: "student_id", header: "ID" },
    {
      accessorKey: "first_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-sm"
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    { accessorKey: "last_name", header: "Last Name" },
    { accessorKey: "mothor_name", header: "Mother's Name" },
    { accessorKey: "father_name", header: "Father's Name" },
    { accessorKey: "parent_phone_primary", header: "Primary Phone" },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" asChild className="text-gray-600 hover:text-blue-600">
              <Link to={`/students/${student.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedStudent(student)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleAddStudent = (student: Student) => {
    setIsAddModalOpen(false);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Students</h2>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className=" text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <AddStudentForm onSubmit={handleAddStudent} isModal={true} />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-lg text-gray-800">Students List</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {studentsData ? (
              <PaginatedDataTable 
                columns={columns} 
                data={studentsData}
                searchColumn="first_name"
                searchPlaceholder="Search students..."
                onPageChange={pagination.handlePageChange}
                onPageSizeChange={pagination.handlePageSizeChange}
                onSearchChange={pagination.handleSearchChange}
                isLoading={isLoading}
              />
            ) : (
              <p className="text-sm text-gray-600">Loading students...</p>
            )}
          </CardContent>
        </Card>

        {selectedStudent && (
          <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
              </DialogHeader>
              <EditStudentForm student={selectedStudent} onSubmit={handleEditStudent} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;