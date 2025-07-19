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
import { AlertCircle, CheckCircle2, Loader2, Share2, Download } from "lucide-react";
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
        }).catch(err => {
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
            if (typeof document === 'undefined') {
                toast({
                    variant: "destructive",
                    title: "Download Failed",
                    description: "This feature is only available on the client-side.",
                });
                return;
            }

            const doc = new jsPDF();
            const { patientData, predictionResult, timestamp, id } = result;

            doc.setFontSize(22);
            doc.text("HeartWise Diagnosis Report", 10, 20);

            doc.setFontSize(12);
            doc.text(`Date: ${new Date(timestamp).toLocaleString()}`, 10, 30);
            doc.line(10, 35, 200, 35);

            doc.setFontSize(16);
            doc.text("Patient Data", 10, 45);
            doc.setFontSize(12);
            let y = 55;
            const patientDataFields: { label: string; value: any; unit?: string }[] = [
                { label: "Age", value: patientData.age },
                { label: "Sex", value: patientData.sex === 1 ? 'Male' : 'Female' },
                { label: "Chest Pain Type", value: patientData.cp },
                { label: "Resting Blood Pressure", value: patientData.trestbps, unit: 'mm Hg' },
                { label: "Serum Cholesterol", value: patientData.chol, unit: 'mg/dl' },
                { label: "Fasting Blood Sugar > 120 mg/dl", value: patientData.fbs === 1 ? 'True' : 'False' },
                { label: "Resting ECG Results", value: patientData.restecg },
                { label: "Maximum Heart Rate Achieved", value: patientData.thalach, unit: 'bpm' },
                { label: "Exercise Induced Angina", value: patientData.exang === 1 ? 'Yes' : 'No' },
                { label: "ST Depression Induced by Exercise", value: patientData.oldpeak },
                { label: "Slope of Peak Exercise ST Segment", value: patientData.slope },
                { label: "Major Vessels Colored by Fluoroscopy", value: patientData.ca },
                { label: "Thal Rate", value: patientData.thal },
            ];
            
            patientDataFields.forEach(field => {
                doc.text(`- ${field.label}: ${field.value} ${field.unit || ''}`, 15, y);
                y += 7;
            });
            
            y += 5;
            doc.line(10, y, 200, y);
            y += 10;
            
            doc.setFontSize(16);
            doc.text("Prediction Result", 10, y);
            y += 10;
            doc.setFontSize(12);
            doc.text(`- Risk: ${predictionResult.riskPrediction === "yes" ? "High Risk" : "Low Risk"}`, 15, y);
            y += 7;
            doc.text(`- Probability: ${(predictionResult.probability * 100).toFixed(2)}%`, 15, y);
            y += 12;

            doc.setFontSize(16);
            doc.text("Explanation", 10, y);
            y += 10;
            doc.setFontSize(12);
            const explanationLines = doc.splitTextToSize(predictionResult.explanation, 180);
            doc.text(explanationLines, 15, y);
            
            doc.save(`HeartWise-Report-${id}.pdf`);
            
            toast({
                title: "Download Complete",
                description: "Your diagnosis report has been downloaded.",
            });
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not download the report.",
            });
        }
    }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Diagnosis...</CardTitle>
          <CardDescription>
            Our AI is analyzing your data. Please wait a moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
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
                    Your results will appear here once you submit the patient data.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex h-64 items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <HeartPulse className="mx-auto h-12 w-12" />
                    <p className="mt-2">Awaiting patient data...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  const isHighRisk = result.predictionResult.riskPrediction === "yes";

  return (
    <Card
      className={`shadow-lg ${isHighRisk ? "border-destructive" : "border-green-500"}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Diagnosis Result</CardTitle>
            <CardDescription>
              Based on the provided data, the predicted risk is{" "}
              <span
                className={`font-bold ${isHighRisk ? "text-destructive" : "text-green-600"}`}
              >
                {(result.predictionResult.probability * 100).toFixed(2)}%
              </span>
              .
            </CardDescription>
          </div>
          <Badge variant={isHighRisk ? "destructive" : "success"}>
            {isHighRisk ? (
              <AlertCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Badge>
        </div>
        
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Explanation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed bg-secondary p-4 rounded-md">
            {result.predictionResult.explanation}
          </p>
        </div>
      </CardContent>
       <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
       </CardFooter>
    </Card>
  );
}
