import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Calendar, Book, Building, CreditCard, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PaginatedResponse } from "@/types";

interface Batch {
  id: string;
  name: string;
  isDefault: boolean;
}

interface Standard {
  id: string;
  name: string;
}

interface Amenity {
  id: string;
  name: string;
  available: boolean;
  fee: number;
}

interface Fee {
  id: string;
  type: "admission" | "monthly" | "other";
  month?: string;
  otherFeeType?: string;
  amount: number;
}

interface BatchFormData {
  name: string;
}

interface StandardFormData {
  name: string;
}

interface AmenityFormData {
  name: string;
  available: boolean;
  fee: number;
}

interface FeeFormData {
  type: "admission" | "monthly" | "other";
  month?: string;
  otherFeeType?: string;
  amount: number;
}

const ConfigPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeeType, setSelectedFeeType] = useState<"admission" | "monthly" | "other" | "">("");

  // Queries
  const { data: batchesData, isLoading: batchesLoading } = useQuery<PaginatedResponse<Batch> | Batch[]>({
    queryKey: ["batches"],
    queryFn: async () => (await api.get("/batches/")).data,
  });
  const batches = Array.isArray(batchesData) ? batchesData : (batchesData?.results || []);

  const { data: standardsData, isLoading: standardsLoading } = useQuery<PaginatedResponse<Standard> | Standard[]>({
    queryKey: ["standards"],
    queryFn: async () => (await api.get("/standards/")).data,
  });
  const standards = Array.isArray(standardsData) ? standardsData : (standardsData?.results || []);

  const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery<PaginatedResponse<Amenity> | Amenity[]>({
    queryKey: ["amenities"],
    queryFn: async () => (await api.get("/amenities/")).data,
  });
  const amenities = Array.isArray(amenitiesData) ? amenitiesData : (amenitiesData?.results || []);

  const { data: feesData, isLoading: feesLoading } = useQuery<PaginatedResponse<Fee> | Fee[]>({
    queryKey: ["fees"],
    queryFn: async () => (await api.get("/fees/")).data,
  });
  const fees = Array.isArray(feesData) ? feesData : (feesData?.results || []);

  // Mutations
  const batchMutation = useMutation({
    mutationFn: (data: BatchFormData) => api.post("/batches/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast({ title: "Success", description: "Batch added successfully." });
      batchMethods.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to add batch." });
    },
  });

  const setDefaultBatchMutation = useMutation({
    mutationFn: (batchId: string) => api.put("/batches/default", { batchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast({ title: "Success", description: "Default batch updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to set default batch." });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: string) => api.delete(`/batches/${batchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      toast({ title: "Success", description: "Batch deleted successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete batch." });
    },
  });

  const standardMutation = useMutation({
    mutationFn: (data: StandardFormData) => api.post("/standards/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standards"] });
      toast({ title: "Success", description: "Standard added successfully." });
      standardMethods.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to add standard." });
    },
  });

  const deleteStandardMutation = useMutation({
    mutationFn: (standardId: string) => api.delete(`/standards/${standardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standards"] });
      toast({ title: "Success", description: "Standard deleted successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete standard." });
    },
  });

  const amenityMutation = useMutation({
    mutationFn: (data: AmenityFormData) => api.post("/amenities/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      toast({ title: "Success", description: "Amenity added successfully." });
      amenityMethods.reset();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to add amenity." });
    },
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: (amenityId: string) => api.delete(`/amenities/${amenityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      toast({ title: "Success", description: "Amenity deleted successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete amenity." });
    },
  });

  const feeMutation = useMutation({
    mutationFn: (data: FeeFormData) => api.post("/fees/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast({ title: "Success", description: "Fee added successfully." });
      feeMethods.reset();
      setSelectedFeeType("");
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to add fee." });
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: (feeId: string) => api.delete(`/fees/${feeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast({ title: "Success", description: "Fee deleted successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete fee." });
    },
  });

  // Form Hooks
  const batchMethods = useForm<BatchFormData>({ defaultValues: { name: "" } });
  const standardMethods = useForm<StandardFormData>({ defaultValues: { name: "" } });
  const amenityMethods = useForm<AmenityFormData>({ defaultValues: { name: "", available: true, fee: 0 } });
  const feeMethods = useForm<FeeFormData>({ defaultValues: { type: "admission", month: "", otherFeeType: "", amount: 0 } });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Configuration</h2>

        {/* Batches Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Batches</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Manage academic batches</CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-school-purple" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {batches && batches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Default</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="text-xs">{batch.name}</TableCell>
                        <TableCell>
                          {batch.isDefault ? (
                            <span className="text-xs text-school-green">Default</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/10"
                              onClick={() => setDefaultBatchMutation.mutate(batch.id)}
                            >
                              Set Default
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBatchMutation.mutate(batch.id)}
                            disabled={batch.isDefault}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No batches configured</p>
              )}
              <FormProvider {...batchMethods}>
                <form
                  onSubmit={batchMethods.handleSubmit((data) => batchMutation.mutate(data))}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Batch Name</FormLabel>
                    <FormControl>
                      <Input
                        {...batchMethods.register("name", { required: "Batch name is required" })}
                        className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm"
                        placeholder="e.g., 2025-2026"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem className="md:col-span-2 lg:col-span-4">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={batchMutation.isPending}
                    >
                      {batchMutation.isPending ? "Adding..." : "Add Batch"}
                    </Button>
                  </FormItem>
                </form>
              </FormProvider>
            </div>
          </CardContent>
        </Card>

        {/* Standards Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Standards</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Manage grade levels</CardDescription>
            </div>
            <Book className="h-4 w-4 text-school-blue" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {standards && standards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standards.map((standard) => (
                      <TableRow key={standard.id}>
                        <TableCell className="text-xs">{standard.name}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteStandardMutation.mutate(standard.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No standards configured</p>
              )}
              <FormProvider {...standardMethods}>
                <form
                  onSubmit={standardMethods.handleSubmit((data) => standardMutation.mutate(data))}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Standard Name</FormLabel>
                    <FormControl>
                      <Input
                        {...standardMethods.register("name", { required: "Standard name is required" })}
                        className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm"
                        placeholder="e.g., Grade 1"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem className="md:col-span-2 lg:col-span-4">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={standardMutation.isPending}
                    >
                      {standardMutation.isPending ? "Adding..." : "Add Standard"}
                    </Button>
                  </FormItem>
                </form>
              </FormProvider>
            </div>
          </CardContent>
        </Card>

        {/* Amenities Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Amenities</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Manage available amenities</CardDescription>
            </div>
            <Building className="h-4 w-4 text-school-green" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {amenities && amenities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Available</TableHead>
                      <TableHead className="text-xs">Fee (₹)</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {amenities.map((amenity) => (
                      <TableRow key={amenity.id}>
                        <TableCell className="text-xs">{amenity.name}</TableCell>
                        <TableCell className="text-xs">{amenity.available ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-xs">₹{amenity.fee.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAmenityMutation.mutate(amenity.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No amenities configured</p>
              )}
              <FormProvider {...amenityMethods}>
                <form
                  onSubmit={amenityMethods.handleSubmit((data) => amenityMutation.mutate(data))}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Amenity Name</FormLabel>
                    <FormControl>
                      <Select
                        {...amenityMethods.register("name", { required: "Amenity name is required" })}
                        onValueChange={(value) => amenityMethods.setValue("name", value)}
                      >
                        <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm">
                          <SelectValue placeholder="Select amenity" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Food", "Coffee", "Pool", "Library", "Gym"].map((amenity) => (
                            <SelectItem key={amenity} value={amenity}>
                              {amenity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Availability</FormLabel>
                    <FormControl>
                      <Select
                        {...amenityMethods.register("available", { required: "Availability is required" })}
                        onValueChange={(value) => amenityMethods.setValue("available", value === "true")}
                      >
                        <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Available</SelectItem>
                          <SelectItem value="false">Not Available</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Fee (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...amenityMethods.register("fee", {
                          required: "Fee is required",
                          min: { value: 0, message: "Fee cannot be negative" },
                        })}
                        className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem className="md:col-span-2 lg:col-span-4">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={amenityMutation.isPending}
                    >
                      {amenityMutation.isPending ? "Adding..." : "Add Amenity"}
                    </Button>
                  </FormItem>
                </form>
              </FormProvider>
            </div>
          </CardContent>
        </Card>

        {/* Fees Configuration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Fees</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Configure default fees</CardDescription>
            </div>
            <CreditCard className="h-4 w-4 text-school-orange" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fees && fees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Month/Type</TableHead>
                      <TableHead className="text-xs">Amount (₹)</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="text-xs">{fee.type}</TableCell>
                        <TableCell className="text-xs">{fee.month || fee.otherFeeType || "-"}</TableCell>
                        <TableCell className="text-xs">₹{fee.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteFeeMutation.mutate(fee.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No fees configured</p>
              )}
              <FormProvider {...feeMethods}>
                <form
                  onSubmit={feeMethods.handleSubmit((data) => feeMutation.mutate(data))}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Fee Type</FormLabel>
                    <FormControl>
                      <Select
                        {...feeMethods.register("type", { required: "Fee type is required" })}
                        onValueChange={(value) => {
                          setSelectedFeeType(value as "admission" | "monthly" | "other");
                          feeMethods.setValue("type", value as "admission" | "monthly" | "other");
                          feeMethods.setValue("month", "");
                          feeMethods.setValue("otherFeeType", "");
                        }}
                      >
                        <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm">
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admission">Admission Fee</SelectItem>
                          <SelectItem value="monthly">Monthly Fee</SelectItem>
                          <SelectItem value="other">Other Fee</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  {selectedFeeType === "monthly" && (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Month</FormLabel>
                      <FormControl>
                        <Select
                          {...feeMethods.register("month", {
                            required: selectedFeeType === "monthly" ? "Month is required" : false,
                          })}
                          onValueChange={(value) => feeMethods.setValue("month", value)}
                        >
                          <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm">
                            <SelectValue placeholder="Select a month" />
                          </SelectTrigger>
                          <SelectContent>
                            {["January 2025", "February 2025", "March 2025", "April 2025"].map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                  {selectedFeeType === "other" && (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Fee Type</FormLabel>
                      <FormControl>
                        <Select
                          {...feeMethods.register("otherFeeType", {
                            required: selectedFeeType === "other" ? "Fee type is required" : false,
                          })}
                          onValueChange={(value) => feeMethods.setValue("otherFeeType", value)}
                        >
                          <SelectTrigger className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm">
                            <SelectValue placeholder="Select a fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Textbook", "Uniform", "Arts", "Sports", "Snacks"].map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...feeMethods.register("amount", {
                          required: "Amount is required",
                          min: { value: 0.01, message: "Amount must be greater than 0" },
                        })}
                        className="w-full border-border focus:ring-2 focus:ring-ring transition-all duration-200 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                  <FormItem className="md:col-span-2 lg:col-span-4">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      disabled={feeMutation.isPending}
                    >
                      {feeMutation.isPending ? "Adding..." : "Add Fee"}
                    </Button>
                  </FormItem>
                </form>
              </FormProvider>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Navigation options</CardDescription>
            </div>
            <ArrowLeft className="h-4 w-4 text-school-blue" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConfigPage;