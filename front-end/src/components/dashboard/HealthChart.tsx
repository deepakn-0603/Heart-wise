import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PatientData } from "@/types";
import { HeartPulse } from "lucide-react";

interface HealthChartProps {
  data: PatientData | null;
}

// These are example "healthy" values. In a real app, these would be more nuanced.
const healthyRanges = {
  trestbps: 120,
  chol: 200,
  thalach: 150,
};

export function HealthChart({ data }: HealthChartProps) {
    if (!data) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Health Metrics Overview</CardTitle>
                    <CardDescription>
                    Comparing key metrics against recommended healthy values.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] flex-col items-center justify-center text-center">
                    <HeartPulse className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No data to display chart.</p>
                </CardContent>
            </Card>
        )
    }

    const chartData = [
        { name: 'Resting BP', yourValue: data.trestbps, healthyValue: healthyRanges.trestbps, unit: 'mm Hg' },
        { name: 'Cholesterol', yourValue: data.chol, healthyValue: healthyRanges.chol, unit: 'mg/dl' },
        { name: 'Max Heart Rate', yourValue: data.thalach, healthyValue: healthyRanges.thalach, unit: 'bpm' },
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics Overview</CardTitle>
        <CardDescription>
          Comparing your key metrics against recommended healthy values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    cursor={{fill: 'hsl(var(--accent))'}}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: '20px'}}/>
                <Bar dataKey="yourValue" fill="hsl(var(--chart-1))" name="Your Value" radius={[4, 4, 0, 0]} />
                <Bar dataKey="healthyValue" fill="hsl(var(--chart-2))" name="Healthy Value" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
