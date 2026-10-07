import unittest
import sys
import os

# Add src to path to import experiment logic
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from deliberation import extract_internal_monologue_and_public_response as extract_tags

class TestSanityCheck(unittest.TestCase):
    
    def test_extract_tags_both(self):
        text = "<private_scratchpad>\nMy thoughts\n</private_scratchpad>\n<public_response>\nMy response\n</public_response>"
        scratchpad, public = extract_tags(text)
        self.assertEqual(scratchpad, "My thoughts")
        self.assertEqual(public, "My response")
        
    def test_extract_tags_missing_public(self):
        text = "<private_scratchpad>\nMy thoughts\n</private_scratchpad>\nMy public text without tags"
        scratchpad, public = extract_tags(text)
        self.assertEqual(scratchpad, "My thoughts")
        self.assertEqual(public, "My public text without tags")
        
    def test_extract_tags_no_tags(self):
        text = "Just direct response"
        scratchpad, public = extract_tags(text)
        self.assertIsNone(scratchpad)
        self.assertEqual(public, "Just direct response")

if __name__ == "__main__":
    unittest.main()

