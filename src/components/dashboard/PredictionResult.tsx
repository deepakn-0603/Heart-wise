import { Diagnosis } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface PredictionResultProps {
  result: Diagnosis | null;
  isLoading: boolean;
}

export function PredictionResult({ result, isLoading }: PredictionResultProps) {
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
      className={`shadow-lg ${isHighRisk ? "border-destructive" : "border-green-500"}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Diagnosis Result</CardTitle>
          <Badge variant={isHighRisk ? "destructive" : "default"} className={`${!isHighRisk && 'bg-green-600'}`}>
            {isHighRisk ? (
              <AlertCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isHighRisk ? "High Risk" : "Low Risk"}
          </Badge>
        </div>
        <CardDescription>
          Based on the provided data, the predicted risk is{" "}
          <span
            className={`font-bold ${isHighRisk ? "text-destructive" : "text-green-600"}`}
          >
            {(result.predictionResult.probability * 100).toFixed(2)}%
          </span>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Explanation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed bg-secondary p-4 rounded-md">
            {result.predictionResult.explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
