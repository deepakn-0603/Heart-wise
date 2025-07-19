import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PatientData } from "@/types";

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
    if (!data) return null;

    const chartData = [
        { name: 'Resting BP', yourValue: data.trestbps, healthyValue: healthyRanges.trestbps, unit: 'mm Hg' },
        { name: 'Cholesterol', yourValue: data.chol, healthyValue: healthyRanges.chol, unit: 'mg/dl' },
        { name: 'Max Heart Rate', yourValue: data.thalach, healthyValue: healthyRanges.thalach, unit: 'bpm' },
    ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Health Metrics Overview</CardTitle>
        <CardDescription>
          Comparing your key metrics against recommended healthy values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                    }}
                    cursor={{fill: 'hsl(var(--muted))'}}
                />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="yourValue" fill="hsl(var(--primary))" name="Your Value" radius={[4, 4, 0, 0]} />
                <Bar dataKey="healthyValue" fill="hsl(var(--accent))" name="Healthy Value" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
