import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import whisper_timestamped as whisper
from pyannote.audio import Pipeline
from pyannote.audio.pipelines.utils.hook import ProgressHook
from tqdm import tqdm

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token="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")
pipeline.to(torch.device("mps"))

whisper_model = whisper.load_model("base")

def find_closest_speaker(whisper_start, whisper_end, diarization, tolerance):
    for segment in diarization:
        if (segment['start'] - tolerance <= whisper_start <= segment['end'] + tolerance or
            segment['start'] - tolerance <= whisper_end <= segment['end'] + tolerance):
            return segment['speaker']
    return "Unknown Speaker"

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    audio_file = request.files['file']
    file_path = os.path.join("uploads", audio_file.filename)
    audio_file.save(file_path)

    with ProgressHook() as hook:
        diarization = pipeline(file_path, num_speakers=2, hook=hook)

    diarization_output = [
        {"start": turn.start, "end": turn.end, "speaker": speaker}
        for turn, _, speaker in diarization.itertracks(yield_label=True)
    ]

    result = whisper.transcribe(whisper_model, file_path, language="en")
    whisper_transcript = [
        {"start": segment["start"], "end": segment["end"], "text": segment["text"]}
        for segment in result["segments"]
    ]

    tolerance = 0.2
    formatted_output = []

    for segment in whisper_transcript:
        speaker = find_closest_speaker(segment['start'], segment['end'], diarization_output, tolerance)
        formatted_output.append({"speaker": speaker, "text": segment['text']})

    os.remove(file_path)

    return jsonify(formatted_output)

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
