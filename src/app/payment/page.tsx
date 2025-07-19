"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserNav } from "@/components/dashboard/UserNav";
import { useToast } from "@/hooks/use-toast";
import { Download, CreditCard, Loader2 } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsPaid(true);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed.",
      });
    }, 2000);
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    const receiptId = `RCPT-${Date.now()}`;
    const date = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.text("HeartWise Payment Receipt", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Receipt ID: ${receiptId}`, 14, 32);
    doc.text(`Date: ${date}`, 14, 38);

    doc.line(14, 45, 196, 45);

    doc.setFontSize(16);
    doc.text("Billing To:", 14, 55);
    doc.setFontSize(12);
    doc.text("John Doe", 14, 62);
    doc.text("patient@example.com", 14, 68);

    doc.line(14, 80, 196, 80);

    // Table Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 14, 88);
    doc.text("Amount", 170, 88);
    doc.setFont("helvetica", "normal");
    
    doc.line(14, 92, 196, 92);
    
    // Table Content
    doc.text("Heart Disease Prediction Report (1x)", 14, 100);
    doc.text("$50.00", 170, 100);
    
    doc.line(14, 110, 196, 110);
    
    // Total
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 140, 118);
    doc.text("$50.00", 170, 118);
    
    doc.save(`HeartWise-Receipt-${receiptId}.pdf`);

     toast({
        title: "Receipt Downloaded",
        description: "Your receipt has been saved as a PDF.",
      });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <Logo />
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial"></div>
          <UserNav />
        </div>
      </header>
       <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-2xl gap-2">
             <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-fit">
              &larr; Back to Dashboard
            </Button>
            <h1 className="text-3xl font-semibold mt-4">Payment</h1>
        </div>
        <div className="mx-auto grid w-full max-w-2xl items-start gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Secure Payment</CardTitle>
                <CardDescription>
                  Complete your payment for the diagnosis service.
                </CardDescription>
              </CardHeader>
              {!isPaid ? (
              <form onSubmit={handlePayment}>
                <CardContent className="space-y-6">
                  <RadioGroup defaultValue="card" className="grid grid-cols-3 gap-4">
                    <div>
                      <RadioGroupItem value="card" id="card" className="peer sr-only" />
                      <Label
                        htmlFor="card"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <CreditCard className="mb-3 h-6 w-6" />
                        Card
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name on card</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="card-number">Card number</Label>
                    <Input id="card-number" placeholder="•••• •••• •••• ••••" required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="month">Expires</Label>
                      <Input id="month" placeholder="MM/YY" required />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="CVC" required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      `Pay $50.00`
                    )}
                  </Button>
                </CardFooter>
              </form>
              ) : (
                <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <CardTitle className="mb-2">Payment Complete!</CardTitle>
                    <CardDescription className="mb-6">Thank you for your payment. You can now download your receipt.</CardDescription>
                    <Button onClick={downloadReceipt}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                    </Button>
                </CardContent>
              )}
            </Card>
        </div>
      </main>
    </div>
  );
}
