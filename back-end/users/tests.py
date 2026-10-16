import json
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient


class SmartHealthRoutineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/smart-health-routine/'
        self.payload = {
            'risk_prediction': 'yes',
            'patient_data': {
                'trestbps': 142,
                'chol': 260,
                'fbs': 1,
            },
        }

    @override_settings(GEMINI_API_KEY='test-key')
    @patch('users.views.genai.Client')
    def test_returns_exactly_three_steps_using_flagged_metrics(self, gemini_client):
        steps = [
            'Choose a lower-sodium meal today.',
            'Take a gentle walk if it is comfortable for you.',
            'Discuss these results with your healthcare professional.',
        ]
        gemini_client.return_value.models.generate_content.return_value = Mock(
            text=json.dumps({'steps': steps})
        )

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {'steps': steps})
        prompt = gemini_client.return_value.models.generate_content.call_args.kwargs['contents']
        self.assertIn('142', prompt)
        self.assertIn('260', prompt)
        self.assertIn('above 120', prompt)

    @override_settings(GEMINI_API_KEY='test-key')
    @patch('users.views.genai.Client')
    def test_rejects_low_risk_result_without_calling_gemini(self, gemini_client):
        payload = {**self.payload, 'risk_prediction': 'no'}

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        gemini_client.assert_not_called()

    @override_settings(GEMINI_API_KEY='')
    @patch('users.views.genai.Client')
    def test_reports_missing_gemini_configuration(self, gemini_client):
        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, 503)
        gemini_client.assert_not_called()

    @override_settings(GEMINI_API_KEY='test-key')
    @patch('users.views.genai.Client')
    def test_rejects_non_numeric_metrics(self, gemini_client):
        payload = {
            **self.payload,
            'patient_data': {**self.payload['patient_data'], 'chol': 'unknown'},
        }

        response = self.client.post(self.url, payload, format='json')

        self.assertEqual(response.status_code, 400)
        gemini_client.assert_not_called()

    @override_settings(GEMINI_API_KEY='test-key')
    @patch('users.views.genai.Client')
    def test_rejects_response_without_three_steps(self, gemini_client):
        gemini_client.return_value.models.generate_content.return_value = Mock(
            text=json.dumps({'steps': ['Only one step']})
        )

        response = self.client.post(self.url, self.payload, format='json')

        self.assertEqual(response.status_code, 502)
