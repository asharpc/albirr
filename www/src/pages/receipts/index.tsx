
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, RefreshCw, Send } from "lucide-react";
import { sampleTransactions } from "@/lib/data";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student, Transaction } from "@/types";
import { sampleStudents } from "@/lib/data";

export default function ReceiptsPage() {
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  
  // Filter income transactions
  const feeTransactions = sampleTransactions.filter(
    transaction => transaction.type === 'income' && transaction.category === 'Monthly Fee'
  );
  
  const studentFeeTransactions = selectedStudent !== "all"
    ? feeTransactions.filter(transaction => String(transaction.relatedTo?.id) === selectedStudent)
    : feeTransactions;
  
  const handleGenerateReceipt = (transaction: Transaction) => {
    setSelectedReceipt(transaction);
  };
  
  const handleSendReceipt = () => {
    // In a real app, this would send the receipt via SMS or WhatsApp
    alert("Receipt sent successfully!");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Receipts</h2>
          <div className="flex items-center gap-2">
            <Select
              value={selectedStudent}
              onValueChange={setSelectedStudent}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {sampleStudents.map((student) => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setSelectedReceipt(null)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Fee Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentFeeTransactions.length > 0 ? (
                    studentFeeTransactions.map((transaction) => {
                      const student = sampleStudents.find(
                        (s) => s.id === transaction.relatedTo?.id
                      ) as Student;
                      
                      return (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center p-4 border rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleGenerateReceipt(transaction)}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.date} - {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{transaction.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">
                              Receipt #{transaction.id}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No fee receipts found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            {selectedReceipt ? (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-center">Fee Receipt</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-school-purple">Eazy Skool</h3>
                    <p className="text-sm text-muted-foreground">123 School Street, Education City</p>
                    <p className="text-sm text-muted-foreground">Phone: +1234567890</p>
                  </div>
                  
                  <div className="border-t border-b py-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Receipt No:</span>
                      <span className="text-sm">{selectedReceipt.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Date:</span>
                      <span className="text-sm">{selectedReceipt.date}</span>
                    </div>
                  </div>
                  
                  {(() => {
                    const student = sampleStudents.find(
                      (s) => s.id === selectedReceipt.relatedTo?.id
                    ) as Student;
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Student Name:</span>
                          <span className="text-sm">{student.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Student ID:</span>
                          <span className="text-sm">{student.studentId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Parent's Name:</span>
                          <span className="text-sm">{student.parentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Description:</span>
                          <span className="text-sm">{selectedReceipt.description}</span>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Amount:</span>
                      <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground pt-4">
                    <p>Thank you for your payment!</p>
                    <p>This is a computer-generated receipt and does not require a signature.</p>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button className="w-1/2" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button className="w-1/2" onClick={handleSendReceipt}>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center min-h-[300px] py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Receipt Selected</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click on a receipt from the list to view and generate it
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
