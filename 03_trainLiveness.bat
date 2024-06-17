call conda.bat activate
call conda activate liveness
python train_liveness.py -d ./dataset -m liveness_model.keras -l le.pickle
PAUSE