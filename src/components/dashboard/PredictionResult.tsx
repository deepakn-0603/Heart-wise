"use client";

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
import { AlertCircle, CheckCircle2, Loader2, Share2, Download, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface PredictionResultProps {
  result: Diagnosis | null;
  isLoading: boolean;
}

export function PredictionResult({ result, isLoading }: PredictionResultProps) {
    const { toast } = useToast();

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

    const handleDownload = () => {
        if (!result) return;

        try {
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
      <Card>
        <CardHeader>
          <CardTitle>Generating Diagnosis...</CardTitle>
          <CardDescription>
            Our AI is analyzing the patient data. Please wait.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
        <Card className="h-full">
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
      className={`shadow-lg ${isHighRisk ? "border-destructive/50" : "border-green-500/50"}`}
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
          <Badge variant={isHighRisk ? "destructive" : "success"} suppressHydrationWarning>
            {isHighRisk ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">AI-Generated Explanation</h3>
          <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
            {result.predictionResult.explanation}
          </p>
        </div>
      </CardContent>
       <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} suppressHydrationWarning>
                <Share2 className="h-4 w-4 mr-1" />
                Share
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload} suppressHydrationWarning>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
            </Button>
       </CardFooter>
    </Card>
  );
}
