import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import pipeline
import whisper_timestamped as whisper
from pyannote.audio import Pipeline
from pyannote.audio.pipelines.utils.hook import ProgressHook
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm

app = Flask(__name__)
CORS(app)  

device = "mps" if torch.backends.mps.is_available() else "cpu"

pyannote_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token="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")
pyannote_pipeline.to(torch.device(device))
whisper_model = whisper.load_model("base")

model_id = "meta-llama/Llama-3.2-1B-Instruct"
pipe = pipeline(
    "text-generation",
    model=model_id,
    torch_dtype=torch.bfloat16,
    device=device,
)

model_name = "all-MiniLM-L6-v2" 
sentence_model = SentenceTransformer(model_name)


def find_closest_speaker(whisper_start, whisper_end, diarization, tolerance):
    for segment in diarization:
        if (segment['start'] - tolerance <= whisper_start <= segment['end'] + tolerance or
            segment['start'] - tolerance <= whisper_end <= segment['end'] + tolerance):
            return segment['speaker']
    return "Unknown Speaker"

def transcribe(request):
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    audio_file = request.files['file']
    file_path = os.path.join("uploads", audio_file.filename)
    audio_file.save(file_path)

    with ProgressHook() as hook:
        diarization = pyannote_pipeline(file_path, num_speakers=2, hook=hook)

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
        formatted_output.append({"speaker": speaker, "text": segment['text'], "start": segment["start"], "end": segment["end"]})

    os.remove(file_path)

    return formatted_output

def generate_merged_transcript(transcript):
    merged_transcript = []
  
    for item in transcript:
        if merged_transcript and merged_transcript[-1]['speaker'] == item['speaker']:
            merged_transcript[-1]['text'] += " " + item['text']
            merged_transcript[-1]['end'] = item['end']
        else:
            merged_transcript.append(item.copy())
            merged_transcript[-1]['id'] = len(merged_transcript)
            merged_transcript[-1]['start'] = item['start']
  
    full_text = " ".join([f"{entry['id']} ) {entry['text']}\n" for entry in merged_transcript])
  
    prompt = f"Consider a conversation between two people and give single paragraph summary. \n{full_text}"
  
    return {"merged_transcript": merged_transcript, "full_text": full_text, "prompt": prompt}

def summarize(prompt):
    outputs = pipe(
        [{"role": "user", "content": prompt}],
        max_new_tokens=256,
    )
    return {"summary": outputs[0]["generated_text"][-1]['content']}

def find_contributing_segments(text, summary, top_n=3, threshold=0.5):
    
    contributing_segments = []
    
    segments = text.split('. ')
    segment_embeddings = sentence_model.encode(segments, convert_to_tensor=True)
    
    summary_split = summary.split('. ')
    for sentence in tqdm(summary_split):
        
        sentence_embedding = sentence_model.encode(sentence, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(sentence_embedding, segment_embeddings)[0]
        top_indices = similarities.topk(top_n).indices
        sentence_contributing_segments = [(segments[idx], similarities[idx].item()) for idx in top_indices if similarities[idx] > threshold]
        
        contributing_segments.append(sentence_contributing_segments)
        
    return contributing_segments
    

@app.route('/process', methods=['POST'])
def process():
    formatted_output = transcribe(request)
    merged_output = generate_merged_transcript(formatted_output)
    summary = summarize(merged_output["prompt"])
    print(summary)
    contributing_segments = find_contributing_segments(merged_output["full_text"], summary["summary"])
    print(contributing_segments)
    
    return jsonify(contributing_segments), 200 

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
