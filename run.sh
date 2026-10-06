#!/bin/bash
set -e

echo "==========================================="
echo "Running Test Suite (Sanity & API Checks)..."
echo "==========================================="
python3 -m unittest discover -s tests -v > tests/test_report.txt 2>&1
echo "Tests completed successfully. Report saved to tests/test_report.txt."
cat tests/test_report.txt

echo "\n==========================================="
echo "Starting Main Experiment Pipeline..."
echo "==========================================="
cd src
python3 main.py --config ../data/config.json

