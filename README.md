
#❤️ HeartWise – AI-Powered Heart Disease Prediction Platform
📌 Overview

HeartWise is a full-stack web application that predicts the risk of heart disease using machine learning models and enhances interpretability using Generative AI.

The system allows users to input clinical data, receive real-time predictions, and understand results through AI-generated, patient-friendly explanations.

🚀 Features
🧾 Patient Data Input – Collect clinical parameters like age, cholesterol, BP, etc.
🧠 ML-Based Prediction – Predict heart disease risk using trained models
📊 Probability Score – Displays likelihood of disease
🤖 GenAI Explanation Engine – Converts predictions into easy-to-understand insights using GenAI
🔐 Authentication – Secure user login/signup
📁 History Tracking – View previous diagnosis results
📈 Data Visualization – Charts for better understanding of health metrics
🏗️ Tech Stack
Frontend & Backend: Next.js (App Router, Server Actions)
Language: TypeScript
Machine Learning: Python, scikit-learn
GenAI: Genkit
Validation: Zod
UI: Tailwind CSS (or your styling choice)
Database: (Add yours: MongoDB / PostgreSQL / etc.)
🤖 GenAI Explanation Flow

This project uses GenAI (via Genkit) to generate explanations:

Structured patient data is passed to a prompt
AI generates human-readable explanations
Fallback mechanism ensures reliability if AI fails

#Project Structure
/app
  /api or server actions
  /components
/ai
  genkit.ts
/flows
  generateExplanation.ts
/models
  ML model files


#Installation & Setup
Clone the repo 
git clone https://github.com/your-username/heartwise.git
cd heartwise

#Install dependencies
npm install

#Setup Environment Variables
Create a .env.local file:
# Add your GenAI / API keys here
GENKIT_API_KEY=your_api_key

Run the Development Server
npm run dev
