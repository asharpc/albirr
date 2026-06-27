
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Logout() {
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  }, [toast]);
  
  return <Navigate to="/auth/login" replace />;
}
