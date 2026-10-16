"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Activity, ClipboardList, FlaskConical, HeartPulse } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { saveDiagnosis, getUserDiagnoses } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

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

const formSections = [
  {
    title: "Vitals",
    description: "Core measurements and personal profile.",
    icon: HeartPulse,
    numerical: ["age", "trestbps", "thalach"],
    categorical: ["sex"],
    className: "",
  },
  {
    title: "Blood Work",
    description: "Key values from your latest blood test.",
    icon: FlaskConical,
    numerical: ["chol"],
    categorical: ["fbs"],
    className: "",
  },
  {
    title: "General",
    description: "Symptoms, ECG findings, and exercise response.",
    icon: ClipboardList,
    numerical: ["oldpeak"],
    categorical: ["cp", "restecg", "exang", "slope", "ca", "thal"],
    className: "xl:col-span-2",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const mounted = useMounted();

  // Check authentication and load user data
  useEffect(() => {
    if (!mounted) return;

    console.log("🔍 Dashboard mounted, checking authentication...");
    setIsChecking(true);

    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the dashboard.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      loadDiagnosisHistory(parsedUser.id);
    } catch (e) {
      localStorage.removeItem("user");
      toast({
        title: "Session Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      router.push("/");
    } finally {
      setIsChecking(false);
    }
  }, [mounted]);

  const loadDiagnosisHistory = async (userId: number) => {
    setIsLoadingHistory(true);
    try {
      const diagnoses = await getUserDiagnoses(userId);

      const formattedHistory: Diagnosis[] = diagnoses.map((d) => ({
        id: d.id.toString(),
        timestamp: d.created_at,
        patientData: {
          age: d.age,
          sex: d.sex,
          cp: d.cp,
          trestbps: d.trestbps,
          chol: d.chol,
          fbs: d.fbs,
          restecg: d.restecg,
          thalach: d.thalach,
          exang: d.exang,
          oldpeak: d.oldpeak,
          slope: d.slope,
          ca: d.ca,
          thal: d.thal,
        },
        predictionResult: {
          riskPrediction: d.risk_prediction as "yes" | "no",
          probability: d.probability,
          explanation: d.explanation,
        },
      }));

      setHistory(formattedHistory);
    } catch (error) {
      toast({
        title: "Warning",
        description: "Could not load diagnosis history from server.",
        variant: "destructive",
      });

      const savedHistory = localStorage.getItem("diagnosisHistory");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed);
        } catch (e) {
          setHistory([]);
        }
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      router.push("/");
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const patientData: PatientData = values;

      const riskScore =
        patientData.chol / 200 + patientData.trestbps / 120 + patientData.age / 50;
      const riskPrediction: PredictionResult["riskPrediction"] =
        riskScore > 3.2 ? "yes" : "no";
      const probability = Math.min(0.95, riskScore / 5 + Math.random() * 0.1);


      const explanationResult = await generateExplanation({
        ...patientData,
        riskPrediction,
        probability,
      });


      const savedDiagnosis = await saveDiagnosis({
        user_id: user.id,
        ...patientData,
        risk_prediction: riskPrediction,
        probability: probability,
        explanation: explanationResult.explanation,
      });


      const newDiagnosis: Diagnosis = {
        id: savedDiagnosis.diagnosis.id.toString(),
        timestamp: savedDiagnosis.diagnosis.created_at,
        patientData,
        predictionResult: {
          riskPrediction,
          probability,
          explanation: explanationResult.explanation,
        },
      };

      // Update state
      const updatedHistory = [newDiagnosis, ...history];
      setCurrentResult(newDiagnosis);
      setHistory(updatedHistory);

      localStorage.setItem("diagnosisHistory", JSON.stringify(updatedHistory));

      toast({
        title: "Analysis Complete",
        description: "Your health report has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description:
          error instanceof Error
            ? error.message
            : "There was an issue processing your data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted || isChecking || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/70 to-emerald-50/50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex h-16 items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-6 shadow-sm backdrop-blur-xl">
            <Skeleton className="h-8 w-32 bg-slate-200/80" />
            <Skeleton className="h-10 w-10 rounded-full bg-slate-200/80" />
          </div>
          <div className="space-y-3 py-4">
            <Skeleton className="h-9 w-72 bg-slate-200/80" />
            <Skeleton className="h-4 w-96 max-w-full bg-slate-200/80" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[28rem] rounded-3xl bg-white/70 lg:col-span-2" />
            <Skeleton className="h-[28rem] rounded-3xl bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/70 to-emerald-50/50">
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-[30rem] h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/60 bg-white/70 px-4 shadow-sm backdrop-blur-xl md:px-6">
        <Logo />
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="relative flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-7xl gap-2">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-sky-700">
            <Activity className="h-4 w-4" />
            HeartWise health overview
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Heart Disease Prediction</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.name || user.email}
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-screen-2xl items-start gap-6 xl:grid-cols-12">
          <div className="grid gap-6 xl:col-span-7">
            <Tabs defaultValue="diagnosis">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-white/70 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl">
                <TabsTrigger value="diagnosis">New Diagnosis</TabsTrigger>
                <TabsTrigger value="history">
                  Diagnosis History
                  {history.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {history.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="diagnosis">
                <Card className="overflow-hidden rounded-3xl border-white/70 bg-white/65 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">Patient Data Input</CardTitle>
                    <CardDescription>
                      Complete each section to build a clear picture of your heart health.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-5"
                      >
                        <div className="grid gap-4 xl:grid-cols-2">
                          {formSections.map((section) => {
                            const SectionIcon = section.icon;
                            const numericalFields = formFields.numerical.filter((field) =>
                              section.numerical.includes(field.name)
                            );
                            const categoricalFields = formFields.categorical.filter((field) =>
                              section.categorical.includes(field.name)
                            );

                            return (
                              <section
                                key={section.title}
                                className={`rounded-2xl border border-white/80 bg-white/55 p-4 shadow-sm backdrop-blur-lg sm:p-5 ${section.className}`}
                              >
                                <div className="mb-5 flex items-start gap-3">
                                  <div className="rounded-xl bg-sky-100/80 p-2.5 text-sky-700">
                                    <SectionIcon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h2 className="font-semibold">{section.title}</h2>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                      {section.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                  {numericalFields.map((field) => (
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
                                              className="border-slate-200/80 bg-white/70 focus:bg-white"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                  {categoricalFields.map((field) => (
                                    <FormField
                                      key={field.name}
                                      control={form.control}
                                      name={field.name as keyof PatientData}
                                      render={({ field: formField }) => (
                                        <FormItem>
                                          <FormLabel>{field.label}</FormLabel>
                                          <Select
                                            onValueChange={(val) =>
                                              formField.onChange(Number(val))
                                            }
                                            defaultValue={String(formField.value)}
                                          >
                                            <FormControl>
                                              <SelectTrigger
                                                suppressHydrationWarning
                                                className="border-slate-200/80 bg-white/70 focus:bg-white"
                                              >
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
                              </section>
                            );
                          })}
                        </div>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full rounded-xl shadow-md sm:w-auto"
                          suppressHydrationWarning
                        >
                          {isLoading ? (
                            <>
                              <span className="mr-2 inline-flex items-center gap-1" aria-hidden="true">
                                <Skeleton className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                                <Skeleton className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 [animation-delay:150ms]" />
                                <Skeleton className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 [animation-delay:300ms]" />
                              </span>
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
                <Card className="rounded-3xl border-white/70 bg-white/65 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Diagnosis History</CardTitle>
                    <CardDescription>
                      Review past diagnosis results from the database.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="space-y-3 py-4" aria-label="Loading diagnosis history">
                        {[0, 1, 2].map((row) => (
                          <div key={row} className="flex items-center gap-4 rounded-xl border border-white/70 bg-white/50 p-4">
                            <Skeleton className="h-10 w-10 rounded-full bg-slate-200/80" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-1/3 bg-slate-200/80" />
                              <Skeleton className="h-3 w-2/3 bg-slate-200/80" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full bg-slate-200/80" />
                          </div>
                        ))}
                      </div>
                    ) : history.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No diagnosis history yet.</p>
                        <p className="text-sm mt-2">
                          Complete a diagnosis to see it here.
                        </p>
                      </div>
                    ) : (
                      <HistoryTable history={history} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div className="grid min-w-0 gap-6 xl:col-span-5 xl:grid-cols-1">
            <PredictionResultDisplay
              result={currentResult}
              isLoading={isLoading}
            />
            <HealthChart
              data={
                currentResult?.patientData ?? history[0]?.patientData ?? null
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}