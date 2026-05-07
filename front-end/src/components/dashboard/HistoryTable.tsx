import { Diagnosis } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface HistoryTableProps {
  history: Diagnosis[];
}

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40 rounded-lg border-2 border-dashed">
        <p className="text-lg font-medium">No diagnoses yet.</p>
        <p className="text-sm">Your past predictions will appear here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-72 w-full rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead className="w-[150px]">Date</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Cholesterol</TableHead>
            <TableHead>Resting BP</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => {
            const isHighRisk = item.predictionResult.riskPrediction === "yes";
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {format(new Date(item.timestamp), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{item.patientData.age}</TableCell>
                <TableCell>{item.patientData.chol}</TableCell>
                <TableCell>{item.patientData.trestbps}</TableCell>
                <TableCell>
                  <Badge
                    variant={isHighRisk ? "destructive" : "success"}
                  >
                     {isHighRisk ? (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      ) : (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      )}
                    {isHighRisk ? "High Risk" : "Low Risk"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
