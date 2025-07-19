"use client";

import { useState } from "react";
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
import { Download, CreditCard, Loader2, ArrowLeft } from "lucide-react";
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
  const [formValues, setFormValues] = useState<z.infer<typeof paymentSchema> | null>(null);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      name: "",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
    },
  });

  const { formState } = form;

  const handlePayment = (values: z.infer<typeof paymentSchema>) => {
    setFormValues(values);
    setTimeout(() => {
      setIsPaid(true);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed.",
      });
      form.reset();
    }, 1500);
  };

  const downloadReceipt = () => {
    if (!formValues) return;
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
    doc.text(formValues.name, 14, 62);
    doc.text("patient@example.com", 14, 68);

    doc.line(14, 80, 196, 80);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 14, 88);
    doc.text("Amount", 170, 88);
    doc.setFont("helvetica", "normal");
    
    doc.line(14, 92, 196, 92);
    
    doc.text("Heart Disease Prediction Report (1x)", 14, 100);
    doc.text("$50.00", 170, 100);
    
    doc.line(14, 110, 196, 110);
    
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
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <Logo />
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
       <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-xl gap-2">
             <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-fit">
              <ArrowLeft />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-semibold mt-4">Secure Payment</h1>
        </div>
        <div className="mx-auto grid w-full max-w-xl items-start gap-6 mt-4">
            <Card>
              {!isPaid ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePayment)}>
                  <CardHeader>
                    <CardTitle>Credit Card Information</CardTitle>
                    <CardDescription>
                      Enter your card details. All transactions are secure.
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
                            <Input placeholder="1234 5678 9012 3456" {...field} />
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
                              <Input placeholder="MM/YY" {...field} />
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
                              <Input placeholder="123" {...field} />
                            </FormControl>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" type="submit" disabled={formState.isSubmitting}>
                      {formState.isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" />
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
                <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    <CreditCard className="w-16 h-16 text-green-500 mb-4" />
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
