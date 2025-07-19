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
        toast({
            title: "Download Started",
            description: "Your diagnosis report is being downloaded.",
        });
        // In a real app, you would generate and download a file (e.g., PDF)
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
    return null;
  }

  const isHighRisk = result.predictionResult.riskPrediction === "yes";

  return (
    <Card
      className={`shadow-lg ${isHighRisk ? "border-destructive" : "border-accent"}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Diagnosis Result</CardTitle>
            <CardDescription>
              Based on the provided data, the predicted risk is{" "}
              <span
                className={`font-bold ${isHighRisk ? "text-destructive" : "text-accent-foreground"}`}
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
                Download
            </Button>
       </CardFooter>
    </Card>
  );
}
