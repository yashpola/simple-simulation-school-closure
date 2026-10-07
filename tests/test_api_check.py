import os
import json
import unittest
from dotenv import load_dotenv
from openai import OpenAI

class TestAPICheck(unittest.TestCase):
    def setUp(self):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        load_dotenv(dotenv_path=os.path.join(project_root, ".env"))
        self.client = OpenAI(
            api_key=os.environ.get("TOGETHER_API_KEY"),
            base_url="https://api.together.xyz/v1",
        )
        
        with open(os.path.join(project_root, "data/exp000/config.json"), "r") as f:
            self.config = json.load(f)
            
    def test_api_key_set(self):
        self.assertIsNotNone(os.environ.get("TOGETHER_API_KEY"), "TOGETHER_API_KEY is not set in .env")
        
    def test_models_accessible(self):
        # We test a simple generation for each model to ensure they are accessible
        models = set(self.config.get("model_config", {}).get("model_assignments", {}).values())
        
        for model in models:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=5
                )
                self.assertTrue(len(response.choices) > 0)
            except Exception as e:
                self.fail(f"API call failed for model {model}: {e}")

if __name__ == "__main__":
    unittest.main()
