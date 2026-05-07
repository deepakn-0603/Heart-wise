const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ... (keep existing interfaces and functions)

// NEW: Diagnosis Interfaces
export interface DiagnosisData {
  user_id: number;
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
  risk_prediction: string;
  probability: number;
  explanation: string;
}

export interface DiagnosisResponse {
  id: number;
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
  risk_prediction: string;
  probability: number;
  explanation: string;
  created_at: string;
}

// NEW: Save Diagnosis
export const saveDiagnosis = async (data: DiagnosisData): Promise<{ message: string; diagnosis: DiagnosisResponse }> => {
  try {
    const response = await fetch(`${API_URL}/diagnosis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to save diagnosis');
    }

    return responseData;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check if the server is running.');
    }
    throw error;
  }
};

// NEW: Get User Diagnosis History
export const getUserDiagnoses = async (userId: number): Promise<DiagnosisResponse[]> => {
  try {
    const response = await fetch(`${API_URL}/diagnosis/${userId}/`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to fetch diagnosis history');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check if the server is running.');
    }
    throw error;
  }
};