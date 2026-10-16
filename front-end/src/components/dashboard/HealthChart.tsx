"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PatientData } from "@/types";
import { HeartPulse, Info } from "lucide-react";

interface HealthChartProps {
  data: PatientData | null;
}

const healthyReferences = {
  trestbps: 120,
  chol: 200,
  thalach: 150,
};

interface HealthMetric {
  metric: string;
  normalizedValue: number;
  baselineValue: number;
  submittedValue: number;
  healthyReference: number;
  unit: string;
}

export function HealthChart({ data }: HealthChartProps) {
  const chartData: HealthMetric[] = data
    ? [
        {
          metric: "BP",
          normalizedValue: (data.trestbps / healthyReferences.trestbps) * 100,
          baselineValue: 100,
          submittedValue: data.trestbps,
          healthyReference: healthyReferences.trestbps,
          unit: "mm Hg",
        },
        {
          metric: "Cholesterol",
          normalizedValue: (data.chol / healthyReferences.chol) * 100,
          baselineValue: 100,
          submittedValue: data.chol,
          healthyReference: healthyReferences.chol,
          unit: "mg/dl",
        },
        {
          metric: "Max HR",
          normalizedValue: (data.thalach / healthyReferences.thalach) * 100,
          baselineValue: 100,
          submittedValue: data.thalach,
          healthyReference: healthyReferences.thalach,
          unit: "bpm",
        },
      ]
    : [];
  const chartMax = Math.max(
    150,
    Math.ceil(Math.max(...chartData.map((metric) => metric.normalizedValue), 100) / 50) * 50
  );

  return (
    <Card className="rounded-3xl border-white/70 bg-white/65 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Health Metric Radar</CardTitle>
        <CardDescription>
          Submitted values compared with healthy reference values.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        {data ? (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={chartData} outerRadius="65%">
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, chartMax]}
                  tickFormatter={(value: number) => `${value}%`}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;

                    const metric = payload[0].payload as HealthMetric;
                    return (
                      <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-lg">
                        <p className="mb-1 font-semibold">{metric.metric}</p>
                        <p>
                          Submitted: {metric.submittedValue} {metric.unit}
                        </p>
                        <p>
                          Reference: {metric.healthyReference} {metric.unit}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {metric.normalizedValue.toFixed(0)}% of reference
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
                />
                <Radar
                  name="Submitted"
                  dataKey="normalizedValue"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.3}
                  isAnimationActive
                />
                <Radar
                  name="Healthy reference"
                  dataKey="baselineValue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.12}
                  isAnimationActive
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-start gap-2 px-2 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              References are general comparison values, not a clinical assessment.
            </div>
          </>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <HeartPulse className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Submit your metrics to see the comparison.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
