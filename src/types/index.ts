export type PatientData = {
  age: number;
  sex: number;
  cp: number;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: number;
  thalach: number;
  exang: number;
  oldpeak: number;
  slope: number;
  ca: number;
  thal: number;
};

export type PredictionResult = {
  riskPrediction: 'yes' | 'no';
  probability: number;
  explanation: string;
};

export type Diagnosis = {
  id: string;
  timestamp: string;
  patientData: PatientData;
  predictionResult: PredictionResult;
};
