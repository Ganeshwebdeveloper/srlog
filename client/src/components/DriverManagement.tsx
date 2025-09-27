import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Mail,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User as UserType, InsertUser, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const driverFormSchema = insertUserSchema.extend({
  name: insertUserSchema.shape.name.min(1, "Name is required"),
  email: insertUserSchema.shape.email.email("Invalid email address"),
  password: insertUserSchema.shape.password.min(6, "Password must be at least 6 characters"),
  role: insertUserSchema.shape.role.refine(val => val === "driver", "Only driver role allowed")
});

type DriverFormData = InsertUser;

export default function DriverManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<UserType | null>(null);
  const { toast } = useToast();

  // Fetch drivers (users with role 'driver')
  const { data: allUsers = [], isLoading } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    refetchInterval: 30000
  });

  const drivers = allUsers.filter(user => user.role === 'driver');

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        role: "driver"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Driver created",
        description: "New driver has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error creating driver",
        description: error.message || "Something went wrong."
      });
    }
  });

  // Delete driver mutation (we don't have update endpoint for users currently)
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      // Note: We need to implement DELETE /api/users/:id endpoint
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Driver deleted",
        description: "Driver has been deleted successfully."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error deleting driver", 
        description: error.message || "Feature not yet implemented."
      });
    }
  });

  // Create form
  const createForm = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "driver"
    }
  });

  const onCreateSubmit = (data: DriverFormData) => {
    createDriverMutation.mutate(data);
  };

  const handleDelete = (driver: UserType) => {
    if (confirm(`Are you sure you want to delete driver ${driver.name}?`)) {
      deleteDriverMutation.mutate(driver.id);
    }
  };

  // Filter drivers
  const filteredDrivers = drivers.filter((driver) => {
    return driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           driver.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Driver Management</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet drivers</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-driver">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Create a new driver account
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Smith" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="e.g. john@srlogistics.com" 
                          {...field} 
                          data-testid="input-email" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Minimum 6 characters" 
                          {...field} 
                          data-testid="input-password" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDriverMutation.isPending}
                    data-testid="button-create-driver"
                  >
                    {createDriverMutation.isPending ? "Creating..." : "Create Driver"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))
        ) : filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No drivers found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Start by adding your first driver"
              }
            </p>
          </div>
        ) : (
          filteredDrivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-elevate cursor-pointer" data-testid={`driver-card-${driver.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(driver.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{driver.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {driver.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default">Driver</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Joined: {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDriver(driver)}
                        disabled={true} // Disable until we implement edit functionality
                        data-testid={`button-edit-${driver.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(driver)}
                        disabled={deleteDriverMutation.isPending}
                        data-testid={`button-delete-${driver.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}