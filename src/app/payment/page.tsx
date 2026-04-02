"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserNav } from "@/components/dashboard/UserNav";
import { useToast } from "@/hooks/use-toast";
import { Download, CreditCard, Loader2, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const paymentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  cardNumber: z.string()
    .min(16, { message: "Card number must be 16 digits." })
    .max(16, { message: "Card number must be 16 digits." })
    .regex(/^\d{16}$/, { message: "Invalid card number format." }),
  expiryDate: z.string()
    .min(5, { message: "Expiry date must be in MM/YY format." })
    .max(5, { message: "Expiry date must be in MM/YY format." })
    .regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, { message: "Invalid expiry date format (MM/YY)." }),
  cvc: z.string()
    .min(3, { message: "CVC must be 3 or 4 digits." })
    .max(4, { message: "CVC must be 3 or 4 digits." })
    .regex(/^\d{3,4}$/, { message: "Invalid CVC." }),
});

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPaid, setIsPaid] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formValues, setFormValues] = useState<z.infer<typeof paymentSchema> | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      name: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  const handlePayment = (values: z.infer<typeof paymentSchema>) => {
    setFormValues(values);
    setTimeout(() => {
      setIsPaid(true);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed securely.",
      });
    }, 1500);
  };

  const downloadReceipt = () => {
    if (!formValues) return;
    try {
      const doc = new jsPDF();
      const receiptId = `RCPT-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const date = new Date().toLocaleDateString();

      // Style Header
      doc.setFillColor(100, 181, 246); // Brand Primary Color
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("HeartWise Receipt", 14, 25);
      
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.text(`Receipt ID: ${receiptId}`, 14, 50);
      doc.text(`Date: ${date}`, 14, 56);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 65, 196, 65);

      doc.setFontSize(16);
      doc.text("Billing To:", 14, 75);
      doc.setFontSize(12);
      doc.text(formValues.name, 14, 82);
      doc.text("patient@example.com", 14, 88);

      doc.line(14, 100, 196, 100);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Description", 14, 110);
      doc.text("Amount", 170, 110);
      doc.setFont("helvetica", "normal");
      
      doc.line(14, 114, 196, 114);
      
      doc.text("Heart Disease Risk Prediction Assessment", 14, 122);
      doc.text("$50.00", 170, 122);
      
      doc.line(14, 130, 196, 130);
      
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid:", 140, 140);
      doc.text("$50.00", 170, 140);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for choosing HeartWise for your health monitoring.", 14, 160);
      
      doc.save(`HeartWise-Receipt-${receiptId}.pdf`);

       toast({
          title: "Receipt Downloaded",
          description: "Your receipt has been saved as a PDF.",
        });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate PDF receipt.",
      });
    }
  };

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
        <div className="w-full max-w-xl mb-6">
             <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Secure Payment</h1>
            <p className="text-muted-foreground">Unlock your full medical report and data trends.</p>
        </div>
        
        <div className="w-full max-w-xl">
            <Card className="shadow-lg border-none">
              {!isPaid ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePayment)}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                      <ShieldCheck className="h-5 w-5" />
                      Encrypted Transaction
                    </div>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>
                      All transactions are secure and encrypted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name on Card</FormLabel>
                          <FormControl>
                            <Input placeholder="John M. Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="0000 0000 0000 0000" className="pl-9" {...field} maxLength={16} />
                            </div>
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} maxLength={5} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="123" type="password" {...field} maxLength={4} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full text-lg h-12 shadow-md" type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        `Pay $50.00`
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
              ) : (
                <CardContent className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Payment Confirmed</CardTitle>
                    <CardDescription className="text-base mb-8">
                      Thank you! Your transaction was successful. You can now download your receipt and access full reports.
                    </CardDescription>
                    <div className="flex flex-col gap-3 w-full">
                      <Button onClick={downloadReceipt} className="w-full h-11" variant="default">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF Receipt
                      </Button>
                      <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full h-11">
                          Back to Dashboard
                      </Button>
                    </div>
                </CardContent>
              )}
            </Card>
        </div>
      </main>
    </div>
  );
}