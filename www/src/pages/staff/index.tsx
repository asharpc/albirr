
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginatedDataTable } from "@/components/ui/paginated-data-table";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Staff, PaginatedResponse } from "@/types";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/usePagination";
import api from "@/lib/api";

export default function StaffPage() {
  const [searchParams] = useSearchParams();
  
  const pagination = usePagination({
    initialPageSize: 20,
  });

  // Get filter from URL params
  const filter = searchParams.get("filter");
  
  const { data: staffData, isLoading } = useQuery<PaginatedResponse<Staff>>({
    queryKey: ["staff", pagination.getParams(), filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      const paginationParams = pagination.getParams();
      
      Object.entries(paginationParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      // Add filter for staff without roles
      if (filter === "no-role") {
        params.append("role__isnull", "true");
      }
      
      const response = await api.get(`/staff/?${params.toString()}`);
      return response.data;
    },
  });

  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <Badge variant={staff.role ? "default" : "secondary"}>
            {staff.role?.name || "No Role"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original;
        
        return (
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" asChild>
              <Link to={`/staff/${staff.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="icon" variant="ghost" asChild>
              <Link to={`/staff/edit/${staff.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <Button asChild>
            <Link to="/staff/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg">Staff List</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            {staffData ? (
              <PaginatedDataTable 
                columns={columns}
                data={staffData}
                searchColumn="first_name"
                searchPlaceholder="Search staff..."
                onPageChange={pagination.handlePageChange}
                onPageSizeChange={pagination.handlePageSizeChange}
                onSearchChange={pagination.handleSearchChange}
                isLoading={isLoading}
              />
            ) : (
              <p className="text-sm text-gray-600">Loading staff...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
