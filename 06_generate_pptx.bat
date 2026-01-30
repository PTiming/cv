call conda.bat activate
call conda activate liveness
pip install python-pptx
python generate_pptx.py -o liveness_presentation.pptx -t "Face Liveness Detection"
PAUSE