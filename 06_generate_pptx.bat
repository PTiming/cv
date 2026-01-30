@echo off
REM Note: Requires python-pptx package. Install with: pip install python-pptx
call conda.bat activate
call conda activate liveness
python generate_pptx.py -o liveness_presentation.pptx -t "Face Liveness Detection"
PAUSE