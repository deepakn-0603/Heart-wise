
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateExplanation } from "@/ai/flows/generate-explanation";
import type { PatientData, PredictionResult, Diagnosis } from "@/types";
import { Logo } from "@/components/Logo";
import { UserNav } from "@/components/dashboard/UserNav";
import { PredictionResult as PredictionResultDisplay } from "@/components/dashboard/PredictionResult";
import { HealthChart } from "@/components/dashboard/HealthChart";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

const formSchema = z.object({
  age: z.coerce.number().min(1, "Age is required").max(120),
  sex: z.coerce.number().min(0).max(1),
  cp: z.coerce.number().min(0).max(3),
  trestbps: z.coerce.number().min(1, "Resting blood pressure is required"),
  chol: z.coerce.number().min(1, "Cholesterol level is required"),
  fbs: z.coerce.number().min(0).max(1),
  restecg: z.coerce.number().min(0).max(2),
  thalach: z.coerce.number().min(1, "Max heart rate is required"),
  exang: z.coerce.number().min(0).max(1),
  oldpeak: z.coerce.number().min(0, "Oldpeak must be non-negative"),
  slope: z.coerce.number().min(0).max(2),
  ca: z.coerce.number().min(0).max(4),
  thal: z.coerce.number().min(0).max(3),
});

const formFields = {
  numerical: [
    { name: "age", label: "Age", placeholder: "e.g., 52" },
    {
      name: "trestbps",
      label: "Resting Blood Pressure (mm Hg)",
      placeholder: "e.g., 120",
    },
    {
      name: "chol",
      label: "Serum Cholesterol (mg/dl)",
      placeholder: "e.g., 210",
    },
    {
      name: "thalach",
      label: "Maximum Heart Rate Achieved",
      placeholder: "e.g., 172",
    },
    {
      name: "oldpeak",
      label: "ST Depression Induced by Exercise",
      placeholder: "e.g., 1.5",
    },
  ],
  categorical: [
    {
      name: "sex",
      label: "Sex",
      options: [
        { value: 1, label: "Male" },
        { value: 0, label: "Female" },
      ],
    },
    {
      name: "cp",
      label: "Chest Pain Type",
      options: [
        { value: 0, label: "Typical Angina" },
        { value: 1, label: "Atypical Angina" },
        { value: 2, label: "Non-anginal Pain" },
        { value: 3, label: "Asymptomatic" },
      ],
    },
    {
      name: "fbs",
      label: "Fasting Blood Sugar > 120 mg/dl",
      options: [
        { value: 1, label: "True" },
        { value: 0, label: "False" },
      ],
    },
    {
      name: "restecg",
      label: "Resting ECG Results",
      options: [
        { value: 0, label: "Normal" },
        { value: 1, label: "ST-T wave abnormality" },
        { value: 2, label: "Probable or definite left ventricular hypertrophy" },
      ],
    },
    {
      name: "exang",
      label: "Exercise Induced Angina",
      options: [
        { value: 1, label: "Yes" },
        { value: 0, label: "No" },
      ],
    },
    {
      name: "slope",
      label: "Slope of Peak Exercise ST Segment",
      options: [
        { value: 0, label: "Upsloping" },
        { value: 1, label: "Flat" },
        { value: 2, label: "Downsloping" },
      ],
    },
    {
      name: "ca",
      label: "Number of Major Vessels Colored by Fluoroscopy",
      options: [
        { value: 0, label: "0" },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" },
        { value: 4, label: "4" },
      ],
    },
    {
      name: "thal",
      label: "Thal Rate",
      options: [
        { value: 0, label: "Unknown" },
        { value: 1, label: "Normal" },
        { value: 2, label: "Fixed Defect" },
        { value: 3, label: "Reversible Defect" },
      ],
    },
  ],
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const mounted = useMounted();

  useEffect(() => {
    if (mounted) {
      const savedHistory = localStorage.getItem("diagnosisHistory");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    }
  }, [mounted]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 52,
      sex: 1,
      cp: 0,
      trestbps: 125,
      chol: 212,
      fbs: 0,
      restecg: 1,
      thalach: 168,
      exang: 0,
      oldpeak: 1.0,
      slope: 2,
      ca: 2,
      thal: 3,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setCurrentResult(null);

    try {
      const patientData: PatientData = values;
      
      // Predict risk based on simple threshold logic for the prototype
      const riskScore = (patientData.chol / 200) + (patientData.trestbps / 120) + (patientData.age / 50);
      const riskPrediction: PredictionResult["riskPrediction"] = riskScore > 3.2 ? "yes" : "no";
      const probability = Math.min(0.95, (riskScore / 5) + (Math.random() * 0.1));

      const explanationResult = await generateExplanation({
        ...patientData,
        riskPrediction,
        probability,
      });

      const newDiagnosis: Diagnosis = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        patientData,
        predictionResult: {
          riskPrediction,
          probability,
          explanation: explanationResult.explanation,
        },
      };
      
      const updatedHistory = [newDiagnosis, ...history];
      setCurrentResult(newDiagnosis);
      setHistory(updatedHistory);
      
      localStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory));
      
      toast({
        title: "Analysis Complete",
        description: "Your health report has been generated successfully.",
      });
    } catch (error) {
      console.error("Diagnosis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "There was an issue processing your data. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-muted/40" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
        <Logo />
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Heart Disease Prediction</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[1fr_380px]">
          <div className="grid gap-6">
            <Tabs defaultValue="diagnosis">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="diagnosis">New Diagnosis</TabsTrigger>
                <TabsTrigger value="history">Diagnosis History</TabsTrigger>
              </TabsList>
              <TabsContent value="diagnosis">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Data Input</CardTitle>
                    <CardDescription>
                      Fill in all fields for an accurate prediction.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                          {formFields.numerical.map((field) => (
                            <FormField
                              key={field.name}
                              control={form.control}
                              name={field.name as keyof PatientData}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>{field.label}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder={field.placeholder}
                                      {...formField}
                                      step="any"
                                      suppressHydrationWarning
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
                          {formFields.categorical.map((field) => (
                            <FormField
                              key={field.name}
                              control={form.control}
                              name={field.name as keyof PatientData}
                              render={({ field: formField }) => (
                                <FormItem>
                                  <FormLabel>{field.label}</FormLabel>
                                  <Select
                                    onValueChange={(val) => formField.onChange(Number(val))}
                                    defaultValue={String(formField.value)}
                                  >
                                    <FormControl>
                                      <SelectTrigger suppressHydrationWarning>
                                        <SelectValue placeholder="Select an option" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {field.options.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={String(option.value)}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto" suppressHydrationWarning>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            "Get Diagnosis"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history">
                 <Card>
                    <CardHeader>
                        <CardTitle>Diagnosis History</CardTitle>
                        <CardDescription>Review past diagnosis results.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HistoryTable history={history} />
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div className="grid gap-6">
            <PredictionResultDisplay
              result={currentResult}
              isLoading={isLoading}
            />
            <HealthChart data={currentResult?.patientData ?? history[0]?.patientData ?? null} />
          </div>
        </div>
      </main>
    </div>
  );
}
