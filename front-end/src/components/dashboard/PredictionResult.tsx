"use client";

import { useEffect, useState } from "react";
import { Diagnosis } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Share2, Download, HeartPulse, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSmartHealthRoutine } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface PredictionResultProps {
  result: Diagnosis | null;
  isLoading: boolean;
}

export function PredictionResult({ result, isLoading }: PredictionResultProps) {
    const { toast } = useToast();
    const [routineSteps, setRoutineSteps] = useState<string[]>([]);
    const [routineState, setRoutineState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [routineError, setRoutineError] = useState("");
    const [routineAttempt, setRoutineAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;

        if (!result || result.predictionResult.riskPrediction !== "yes") {
            setRoutineSteps([]);
            setRoutineError("");
            setRoutineState("idle");
            return () => {
                cancelled = true;
            };
        }

        setRoutineSteps([]);
        setRoutineError("");
        setRoutineState("loading");

        generateSmartHealthRoutine(result.patientData, result.predictionResult.riskPrediction)
            .then(({ steps }) => {
                if (!cancelled) {
                    setRoutineSteps(steps);
                    setRoutineState("success");
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setRoutineError(
                        error instanceof Error
                            ? error.message
                            : "The smart health routine could not be generated.",
                    );
                    setRoutineState("error");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [result, routineAttempt]);

    const handleShare = () => {
        if (!result) return;
        const shareText = `HeartWise Diagnosis Result:
- Risk: ${result.predictionResult.riskPrediction === "yes" ? "High Risk" : "Low Risk"}
- Probability: ${(result.predictionResult.probability * 100).toFixed(2)}%
- Explanation: ${result.predictionResult.explanation}`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            toast({
                title: "Copied to Clipboard",
                description: "Diagnosis result has been copied.",
            });
        }).catch(() => {
             toast({
                variant: "destructive",
                title: "Failed to Copy",
                description: "Could not copy results to clipboard.",
            });
        });
    }

    const handleDownload = async () => {
        if (!result) return;

        try {
            const { default: jsPDF } = await import("jspdf");
            const doc = new jsPDF();
            const { patientData, predictionResult, timestamp, id } = result;

            doc.setFontSize(22);
            doc.text("HeartWise Diagnosis Report", 14, 22);

            doc.setFontSize(10);
            doc.text(`Report ID: ${id}`, 14, 30);
            doc.text(`Date: ${new Date(timestamp).toLocaleString()}`, 14, 35);
            doc.line(14, 40, 196, 40);

            doc.setFontSize(14);
            doc.text("Prediction Result", 14, 50);
            doc.setFontSize(11);
            doc.text(`- Risk Assessment: ${predictionResult.riskPrediction === "yes" ? "High Risk" : "Low Risk"}`, 20, 58);
            doc.text(`- Probability Score: ${(predictionResult.probability * 100).toFixed(2)}%`, 20, 64);
            
            let y = 75;
            doc.setFontSize(14);
            doc.text("AI-Generated Explanation", 14, y);
            y += 8;
            doc.setFontSize(11);
            const explanationLines = doc.splitTextToSize(predictionResult.explanation, 180);
            doc.text(explanationLines, 20, y);
            y += explanationLines.length * 6 + 10;
            
            doc.line(14, y, 196, y);
            y += 10;

            doc.setFontSize(14);
            doc.text("Patient Data Summary", 14, y);
            y += 8;
            doc.setFontSize(11);

            const dataPoints = [
                `Age: ${patientData.age}`,
                `Sex: ${patientData.sex === 1 ? 'Male' : 'Female'}`,
                `Resting BP: ${patientData.trestbps} mm Hg`,
                `Cholesterol: ${patientData.chol} mg/dl`,
                `Max Heart Rate: ${patientData.thalach} bpm`,
            ];

            dataPoints.forEach((point) => {
                doc.text(point, 20, y);
                y += 6;
            });
            
            doc.save(`HeartWise-Report-${id.substring(0, 8)}.pdf`);
            
            toast({
                title: "Download Complete",
                description: "Your diagnosis report has been downloaded.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Download Failed",
                description: "An unexpected error occurred while generating the PDF.",
            });
        }
    }

  if (isLoading) {
    return (
      <Card className="w-full min-w-0 rounded-3xl border-white/70 bg-white/65 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Generating Diagnosis...</CardTitle>
          <CardDescription>
            Our AI is analyzing the patient data. Please wait.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl bg-sky-100/80" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 bg-slate-200/80" />
              <Skeleton className="h-3 w-1/2 bg-slate-200/80" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-2xl bg-slate-200/60" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl bg-slate-200/60" />
            <Skeleton className="h-16 rounded-xl bg-slate-200/60" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
        <Card className="h-full w-full min-w-0 rounded-3xl border-white/70 bg-white/65 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle>Ready for Diagnosis</CardTitle>
                <CardDescription>
                    Your results will appear here once you submit data.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex h-[300px] flex-col items-center justify-center text-center">
                <HeartPulse className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Awaiting patient data...</p>
            </CardContent>
        </Card>
    );
  }

  const isHighRisk = result.predictionResult.riskPrediction === "yes";

  return (
    <Card
      className={`w-full min-w-0 rounded-3xl bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 ${isHighRisk ? "border-destructive/50 ring-1 ring-destructive/20" : "border-green-500/50 ring-1 ring-green-500/20"}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Diagnosis Result</CardTitle>
            <CardDescription>
              Predicted risk is{' '}
              <span className={`font-bold ${isHighRisk ? "text-destructive" : "text-green-600"}`}>
                {(result.predictionResult.probability * 100).toFixed(1)}%
              </span>
            </CardDescription>
          </div>
          <Badge variant={isHighRisk ? "destructive" : "success"} suppressHydrationWarning className="px-3 py-1">
            {isHighRisk ? (
              <AlertCircle className="h-4 w-4 mr-1" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">AI-Generated Explanation</h3>
          <div className="rounded-lg border border-border/50 bg-muted/50 p-4">
            <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
              <ReactMarkdown>
                {result.predictionResult.explanation}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        {isHighRisk && (
          <section className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4" aria-live="polite">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-700" aria-hidden="true" />
              <h3 className="font-semibold text-lg">Smart Health Routine</h3>
            </div>
            {routineState === "loading" && (
              <div className="space-y-3" aria-label="Generating your routine">
                <Skeleton className="h-4 w-full bg-sky-100" />
                <Skeleton className="h-4 w-11/12 bg-sky-100" />
                <Skeleton className="h-4 w-10/12 bg-sky-100" />
              </div>
            )}
            {routineState === "success" && (
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {routineSteps.map((step, index) => (
                  <li key={`${index}-${step}`}>{step}</li>
                ))}
              </ol>
            )}
            {routineState === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{routineError}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRoutineAttempt((attempt) => attempt + 1)}
                >
                  Try again
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              General wellness suggestions only—not a diagnosis or a substitute for advice from your healthcare professional.
            </p>
          </section>
        )}
      </CardContent>
       <CardFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleShare} suppressHydrationWarning>
                <Share2 className="h-4 w-4 mr-2" />
                Share
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload} suppressHydrationWarning className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
            </Button>
       </CardFooter>
    </Card>
  );
}
