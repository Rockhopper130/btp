import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
# from transformers import pipeline
# import whisper
# from pyannote.audio import Pipeline
# from pyannote.audio.pipelines.utils.hook import ProgressHook
from sentence_transformers import SentenceTransformer, util
from tqdm import tqdm

# from sklearn.linear_model import LogisticRegression
# from sklearn.svm import SVC
# from sklearn.neighbors import KNeighborsClassifier
# from sklearn.tree import DecisionTreeClassifier
# from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
# from sklearn.model_selection import train_test_split, cross_val_score, KFold, StratifiedKFold
# from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
# import matplotlib.pyplot as plt
# import seaborn as sns
# import numpy as np
# import pandas as pd


app = Flask(__name__)
CORS(app)  

device = "mps" if torch.backends.mps.is_available() else "cpu"

# pyannote_pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1", use_auth_token="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")
# pyannote_pipeline.to(torch.device(device))
# whisper_model = whisper.load_model("base")

# model_id = "meta-llama/Llama-3.2-1B-Instruct"
# pipe = pipeline(
#     "text-generation",
#     model=model_id,
#     torch_dtype=torch.bfloat16,
#     device=device,
# )

model_name = "all-MiniLM-L6-v2" 
sentence_model = SentenceTransformer(model_name)


# def find_closest_speaker(whisper_start, whisper_end, diarization, tolerance):
#     for segment in diarization:
#         if (segment['start'] - tolerance <= whisper_start <= segment['end'] + tolerance or
#             segment['start'] - tolerance <= whisper_end <= segment['end'] + tolerance):
#             return segment['speaker']
#     return "Unknown Speaker"

# def transcribe(request):
#     if 'file' not in request.files:
#         return jsonify({"error": "No file provided"}), 400
    
#     audio_file = request.files['file']
#     file_path = os.path.join("uploads", audio_file.filename)
#     audio_file.save(file_path)

#     with ProgressHook() as hook:
#         diarization = pyannote_pipeline(file_path, num_speakers=2, hook=hook)

#     diarization_output = [
#         {"start": turn.start, "end": turn.end, "speaker": speaker}
#         for turn, _, speaker in diarization.itertracks(yield_label=True)
#     ]

#     # result = whisper.transcribe(whisper_model, file_path, language="en")
#     result = whisper_model.transcribe(file_path, word_timestamps=True, language="en")
#     whisper_transcript = [
#         {"start": segment["start"], "end": segment["end"], "text": segment["text"]}
#         for segment in result["segments"]
#     ]

#     tolerance = 0.2
#     formatted_output = []

#     for segment in whisper_transcript:
#         speaker = find_closest_speaker(segment['start'], segment['end'], diarization_output, tolerance)
#         formatted_output.append({"speaker": speaker, "text": segment['text'], "start": segment["start"], "end": segment["end"]})

#     os.remove(file_path)

#     return formatted_output

# def generate_merged_transcript(transcript):
#     merged_transcript = []
  
#     for item in transcript:
#         if merged_transcript and merged_transcript[-1]['speaker'] == item['speaker']:
#             merged_transcript[-1]['text'] += " " + item['text']
#             merged_transcript[-1]['end'] = item['end']
#         else:
#             merged_transcript.append(item.copy())
#             merged_transcript[-1]['id'] = len(merged_transcript)
#             merged_transcript[-1]['start'] = item['start']
  
#     full_text = " ".join([f"{entry['id']} ) {entry['text']} #\n" for entry in merged_transcript])
  
#     prompt = f"Consider a conversation between two people and give single paragraph summary. \n{full_text}"
  
#     return {"merged_transcript": merged_transcript, "full_text": full_text, "prompt": prompt}

# def summarize(prompt):
#     outputs = pipe(
#         [{"role": "user", "content": prompt}],
#         max_new_tokens=256,
#     )
#     return {"summary": outputs[0]["generated_text"][-1]['content']}

def get_item_by_id(merged_transcript, idx):
    for item in merged_transcript:
        if item['id'] == idx:
            return item
    return None

def find_contributing_segments(merged_output, summary, top_n=3, threshold=0.5):
    
    contributing_segments = []
    text = merged_output["full_text"]
    merged_transcript = merged_output["merged_transcript"]
    
    segments = text.split('#\n')
    print("segments",segments)
    segment_embeddings = sentence_model.encode(segments, convert_to_tensor=True)
    
    try:
        summary_split = summary.split('\n\n')[1].split('. ')
    except:
        summary_split = summary.split('. ')
        
    for sentence in tqdm(summary_split):
        
        sentence_embedding = sentence_model.encode(sentence, convert_to_tensor=True)
        similarities = util.pytorch_cos_sim(sentence_embedding, segment_embeddings)[0]
        top_indices = similarities.topk(top_n).indices
        
        sentence_contributing_segments = {
            "sentence_data": [get_item_by_id(merged_transcript, idx + 1) for idx in top_indices],
            "summary_sentence": sentence
        }
        
        contributing_segments.append(sentence_contributing_segments)

    return contributing_segments


# def load_model_and_predict(model_path, X_new, input_dim=8, class_names=None):
#     model_path = "MLP.pt"
#     device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

#     model = MLPClassifier(input_dim=input_dim).to(device)
#     model.load_state_dict(torch.load(model_path, map_location=device))
#     model.eval()

#     X_tensor = torch.tensor(X_new, dtype=torch.float32).to(device)

#     # Inference
#     with torch.no_grad():
#         logits = model(X_tensor)
#         preds = logits.argmax(dim=1).cpu().numpy()

#     if class_names:
#         preds = [class_names[p] for p in preds]

#     return preds
    
    
# def ml_model_score_pred():

#     # Assuming X and Y are already defined and transform_y function exists
#     # Transform target if needed
#     Y_cls = transform_y(Y)

#     X_cent = (X - X.mean(axis=0)) / X.std(axis=0)

#     # Train-test split for final evaluation
#     X_train, X_test, Y_train, Y_test = train_test_split(X_cent, Y_cls, test_size=0.2, random_state=42, stratify=Y_cls)

#     # Initialize models
#     models = {
#         'Logistic Regression': LogisticRegression(class_weight='balanced', random_state=42, max_iter=1000),
#         'Support Vector Machine': SVC(class_weight='balanced', random_state=42, probability=True),
#         'K-Nearest Neighbors': KNeighborsClassifier(),
#         'Decision Tree': DecisionTreeClassifier(class_weight='balanced', random_state=42),
#         'Gradient Boosting': GradientBoostingClassifier(random_state=42),
#         'Random Forest': RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
#     }

#     # Dictionary to store results
#     cv_results = {}
#     test_results = {}
#     conf_matrices = {}

#     # Define 5-fold cross-validation
#     cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

#     # Perform cross-validation and final evaluation for each model
#     for model_name, model in models.items():
#         print(f"\nEvaluating {model_name}...")
        
#         # 5-fold cross-validation
#         cv_scores = cross_val_score(model, X_cent, Y_cls, cv=cv, scoring='accuracy')
#         cv_results[model_name] = {
#             'mean_accuracy': cv_scores.mean(),
#             'std_accuracy': cv_scores.std(),
#             'cv_scores': cv_scores
#         }
        
#         print(f"Cross-validation accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
#         # Train on full training set and evaluate on test set
#         model.fit(X_train, Y_train)
#         preds = model.predict(X_test)
        
#         # Calculate metrics
#         test_acc = accuracy_score(Y_test, preds)
#         report = classification_report(Y_test, preds, digits=4, output_dict=True)
#         cm = confusion_matrix(Y_test, preds)
        
#         # Store results
#         test_results[model_name] = {
#             'accuracy': test_acc,
#             'report': report
#         }
#         conf_matrices[model_name] = cm
        
#         print(f"Test set accuracy: {test_acc:.4f}")

#     # Create DataFrame for CV results
#     cv_df = pd.DataFrame({
#         'Model': list(cv_results.keys()),
#         'CV Mean Accuracy': [cv_results[model]['mean_accuracy'] for model in cv_results],
#         'CV Std Accuracy': [cv_results[model]['std_accuracy'] for model in cv_results],
#         'Test Accuracy': [test_results[model]['accuracy'] for model in cv_results]
#     }).sort_values('CV Mean Accuracy', ascending=False)

#     return np.mean(cv_df["mean_sccuracy"])


@app.route('/process', methods=['POST'])
def process():
    # formatted_output = transcribe(request)
    # merged_output = generate_merged_transcript(formatted_output)
    # print(merged_output)
    # print("----")
    
    # summary = summarize(merged_output["prompt"])
    # print(summary)
    # print("----")
    
    merged_output = {'merged_transcript': [{'speaker': 'SPEAKER_01', 'text': ' at the pulpit in the world of biology. So that was a nice shock.', 'start': 0.64, 'end': 5.76, 'id': 1}, {'speaker': 'SPEAKER_00', 'text': " So did you go straight from a bachelor's to a PhD?", 'start': 8.14, 'end': 11.4, 'id': 2}, {'speaker': 'SPEAKER_01', 'text': " Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years.", 'start': 12.1, 'end': 36.18, 'id': 3}, {'speaker': 'SPEAKER_00', 'text': " Was it, I guess, for lack of better, we're like intimidating, like going straight  into like a PhD program, or were you like kind of used the idea right then?", 'start': 37.86, 'end': 46.48, 'id': 4}, {'speaker': 'SPEAKER_01', 'text': " No, you know, after four years of engineering school, I, you know,  I was very humbled. So I was not terribly intimidated. I just,  I just knew that I could probably, you know, just suffer through it,  like I suffered through engineering school.  It's not a little bit of a messochistic, so I'm too poor to say.", 'start': 47.76, 'end': 75.7, 'id': 5}, {'speaker': 'SPEAKER_00', 'text': ' Where did you go to school at? Did you go to the same school for your  PhD program as a bachelor or did you switch up schools? I had to switch the', 'start': 77.12, 'end': 84.08, 'id': 6}, {'speaker': 'SPEAKER_01', 'text': " institution that I went for my undergraduate, didn't have a graduate  program and the institute that I went to offered a stipend.  So they made the decision very easy because I got  accepted in a couple different colleges. One of them was a Cornell, so I felt  very happy because it was kind of a, you know, I felt honored to be accepted there,  but they wanted 60,000 a year for tuition. And they included 50% stipend  and scholarship and still.", 'start': 84.08, 'end': 119.98, 'id': 7}], 'full_text': "1 )  at the pulpit in the world of biology. So that was a nice shock. #\n 2 )  So did you go straight from a bachelor's to a PhD? #\n 3 )  Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years. #\n 4 )  Was it, I guess, for lack of better, we're like intimidating, like going straight  into like a PhD program, or were you like kind of used the idea right then? #\n 5 )  No, you know, after four years of engineering school, I, you know,  I was very humbled. So I was not terribly intimidated. I just,  I just knew that I could probably, you know, just suffer through it,  like I suffered through engineering school.  It's not a little bit of a messochistic, so I'm too poor to say. #\n 6 )  Where did you go to school at? Did you go to the same school for your  PhD program as a bachelor or did you switch up schools? I had to switch the #\n 7 )  institution that I went for my undergraduate, didn't have a graduate  program and the institute that I went to offered a stipend.  So they made the decision very easy because I got  accepted in a couple different colleges. One of them was a Cornell, so I felt  very happy because it was kind of a, you know, I felt honored to be accepted there,  but they wanted 60,000 a year for tuition. And they included 50% stipend  and scholarship and still. #\n", 'prompt': "Consider a conversation between two people and give single paragraph summary. \n1 )  at the pulpit in the world of biology. So that was a nice shock. #\n 2 )  So did you go straight from a bachelor's to a PhD? #\n 3 )  Yeah, it's in medical sciences, they have this kind of accelerated  programs that after you graduate, they send you to  school for five more years and then you get your PhD from there. So  it's kind of like a master to PhD together, five years. #\n 4 )  Was it, I guess, for lack of better, we're like intimidating, like going straight  into like a PhD program, or were you like kind of used the idea right then? #\n 5 )  No, you know, after four years of engineering school, I, you know,  I was very humbled. So I was not terribly intimidated. I just,  I just knew that I could probably, you know, just suffer through it,  like I suffered through engineering school.  It's not a little bit of a messochistic, so I'm too poor to say. #\n 6 )  Where did you go to school at? Did you go to the same school for your  PhD program as a bachelor or did you switch up schools? I had to switch the #\n 7 )  institution that I went for my undergraduate, didn't have a graduate  program and the institute that I went to offered a stipend.  So they made the decision very easy because I got  accepted in a couple different colleges. One of them was a Cornell, so I felt  very happy because it was kind of a, you know, I felt honored to be accepted there,  but they wanted 60,000 a year for tuition. And they included 50% stipend  and scholarship and still. #\n"}
    summary = {"summary" : 'Here\'s a summary of the conversation between the two people:\n\nThe conversation revolves around the speaker\'s experience in pursuing a PhD in medical sciences. The speaker recounts how they were initially drawn to a pulpit in the world of biology, which was a "nice shock" for them. They then discuss their academic background, mentioning that they graduated from a bachelor\'s program and went on to pursue a PhD, which they completed in five years with an accelerated program. The speaker expresses their initial feeling of intimidation, but ultimately felt humbled and able to "suffer through" the program. They share that they had to switch institutions to secure a graduate program, with Cornell being a preferred choice that offered a stipend and scholarship.'}
    
    contributing_segments = find_contributing_segments(merged_output, summary["summary"])
    print(contributing_segments)
    print("----")
    
    return jsonify(contributing_segments), 200 

if __name__ == '__main__':
    os.makedirs("uploads", exist_ok=True)
    app.run(debug=True)
