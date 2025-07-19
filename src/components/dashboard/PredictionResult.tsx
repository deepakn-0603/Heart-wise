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

            doc.setFontSize(12);
            doc.text(`Report ID: ${id}`, 14, 32);
            doc.text(`Date: ${new Date(timestamp).toLocaleString()}`, 14, 38);
            doc.line(14, 45, 196, 45);

            doc.setFontSize(16);
            doc.text("Prediction Result", 14, 55);
            doc.setFontSize(12);
            doc.text(`- Risk Assessment: ${predictionResult.riskPrediction === "yes" ? "High Risk" : "Low Risk"}`, 20, 65);
            doc.text(`- Probability Score: ${(predictionResult.probability * 100).toFixed(2)}%`, 20, 72);
            
            let y = 82;
            doc.setFontSize(16);
            doc.text("AI-Generated Explanation", 14, y);
            y += 8;
            doc.setFontSize(12);
            const explanationLines = doc.splitTextToSize(predictionResult.explanation, 180);
            doc.text(explanationLines, 20, y);
            y += explanationLines.length * 5 + 10;
            
            doc.line(14, y, 196, y);
            y += 10;

            doc.setFontSize(16);
            doc.text("Patient Data Used for Analysis", 14, y);
            y += 10;
            doc.setFontSize(12);

            const patientDataFields: { label: string; value: any; }[] = [
                { label: "Age", value: patientData.age },
                { label: "Sex", value: patientData.sex === 1 ? 'Male' : 'Female' },
                { label: "Chest Pain Type", value: patientData.cp },
                { label: "Resting Blood Pressure", value: `${patientData.trestbps} mm Hg` },
                { label: "Serum Cholesterol", value: `${patientData.chol} mg/dl` },
                { label: "Fasting Blood Sugar > 120 mg/dl", value: patientData.fbs === 1 ? 'True' : 'False' },
                { label: "Resting ECG", value: patientData.restecg },
                { label: "Max Heart Rate", value: `${patientData.thalach} bpm` },
                { label: "Exercise Angina", value: patientData.exang === 1 ? 'Yes' : 'No' },
                { label: "ST Depression", value: patientData.oldpeak },
                { label: "Slope of ST Segment", value: patientData.slope },
                { label: "Major Vessels (Fluoroscopy)", value: patientData.ca },
                { label: "Thal Rate", value: patientData.thal },
            ];
            
            patientDataFields.forEach((field, index) => {
                doc.text(`${field.label}: ${field.value}`, 20, y);
                y += 7;
                if (index === 6) { // column break
                    y = 137;
                    doc.text(`${patientDataFields[7].label}: ${patientDataFields[7].value}`, 110, y-7);
                }
            });
            
            doc.save(`HeartWise-Report-${id}.pdf`);
            
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
          <Badge variant={isHighRisk ? "destructive" : "success"}>
            {isHighRisk ? (
              <AlertCircle />
            ) : (
              <CheckCircle2 />
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
            <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 />
                Share
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload}>
                <Download/>
                Download PDF
            </Button>
       </CardFooter>
    </Card>
  );
}
