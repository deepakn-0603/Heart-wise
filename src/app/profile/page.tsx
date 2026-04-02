"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Calendar as CalendarIcon, ArrowLeft, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserNav } from "@/components/dashboard/UserNav";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved successfully.",
    });
  }

  if (!isClient) return null;
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <Logo />
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-10 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground">Manage your personal and medical information settings.</p>
        </div>

        <div className="w-full max-w-2xl">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>
                Updates here will be reflected in your diagnosis history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-10 pb-6 border-b">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                    <AvatarImage src="https://picsum.photos/seed/profile/200/200" alt="@user" data-ai-hint="profile picture" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold">John Doe</h2>
                  <p className="text-muted-foreground font-medium">Patient Account</p>
                  <p className="text-xs text-muted-foreground mt-1">Joined March 2024</p>
                </div>
              </div>

              <form onSubmit={handleSaveChanges} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="name" defaultValue="John Doe" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" defaultValue="patient@example.com" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="dob" type="text" defaultValue="January 1, 1980" className="pl-9" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" size="lg" className="px-8 shadow-sm">Save Profile Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}