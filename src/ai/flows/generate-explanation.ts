// src/ai/flows/generate-explanation.ts
'use server';
/**
 * @fileOverview A flow that generates an explanation of a heart disease risk prediction.
 *
 * - generateExplanation - A function that generates an explanation of why a user received a specific heart disease risk prediction.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  age: z.number().describe('The age of the patient.'),
  sex: z.number().describe('The sex of the patient (0 = female, 1 = male).'),
  cp: z.number().describe('Chest pain type (0-3).'),
  trestbps: z.number().describe('Resting blood pressure.'),
  chol: z.number().describe('Serum cholesterol in mg/dl.'),
  fbs: z.number().describe('Fasting blood sugar > 120 mg/dl (0 = false, 1 = true).'),
  restecg: z.number().describe('Resting electrocardiographic results (0-2).'),
  thalach: z.number().describe('Maximum heart rate achieved.'),
  exang: z.number().describe('Exercise induced angina (0 = no, 1 = yes).'),
  oldpeak: z.number().describe('ST depression induced by exercise relative to rest.'),
  slope: z.number().describe('The slope of the peak exercise ST segment.'),
  ca: z.number().describe('Number of major vessels (0-3) colored by fluoroscopy.'),
  thal: z.number().describe('Thal rate.'),
  riskPrediction: z.string().describe('The predicted risk of heart disease (yes/no).'),
  probability: z.number().describe('The probability of the prediction.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the heart disease risk prediction.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are an expert medical professional explaining heart disease risk predictions to patients.

  Based on the following patient data and the heart disease risk prediction, provide a clear and concise explanation of why the patient received this prediction. Explain the factors that contributed to the risk and how they relate to heart disease.

  Patient Data:
  - Age: {{{age}}}
  - Sex: {{{sex}}} (0 = female, 1 = male)
  - Chest Pain Type: {{{cp}}} (0-3)
  - Resting Blood Pressure: {{{trestbps}}}
  - Serum Cholesterol: {{{chol}}} mg/dl
  - Fasting Blood Sugar > 120 mg/dl: {{{fbs}}} (0 = false, 1 = true)
  - Resting Electrocardiographic Results: {{{restecg}}} (0-2)
  - Maximum Heart Rate Achieved: {{{thalach}}}
  - Exercise Induced Angina: {{{exang}}} (0 = no, 1 = yes)
  - ST Depression Induced by Exercise: {{{oldpeak}}}
  - Slope of Peak Exercise ST Segment: {{{slope}}}
  - Number of Major Vessels Colored by Fluoroscopy: {{{ca}}} (0-3)
  - Thal Rate: {{{thal}}}

  Heart Disease Risk Prediction: {{{riskPrediction}}} (Probability: {{{probability}}})

  Explanation:`,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
