call conda.bat activate
call conda activate liveness
python liveness_demo.py -m liveness_model.keras -l le.pickle -d ./face_detector -c 0.5
PAUSE