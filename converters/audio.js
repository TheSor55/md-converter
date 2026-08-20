/**
 * converters/audio.js
 * Handles audio transcription.
 * Implements Local Speech Recognition (webkitSpeechRecognition)
 * and external API Providers (Whisper / Gemini) with upload progress.
 */

export function isBrowserSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class TranscriptionProvider {
  async transcribe(file, apiKey, onProgress) {
    throw new Error("Transcribe method not implemented");
  }
}

// Mode B: OpenAI Whisper Provider
export class WhisperProvider extends TranscriptionProvider {
  async transcribe(file, apiKey, onProgress) {
    if (!apiKey) {
      throw new Error("API Key is required for OpenAI Whisper transcription.");
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.openai.com/v1/audio/transcriptions");
      xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') {
          // Reserve the last 10% for server response time
          const pct = Math.round((e.loaded / e.total) * 90);
          onProgress(pct);
        }
      };
      
      xhr.onload = () => {
        if (typeof onProgress === 'function') onProgress(100);
        if (xhr.status === 200) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.text || "");
          } catch {
            reject(new Error("Failed to parse Whisper response JSON"));
          }
        } else {
          reject(new Error(`Whisper API Error: ${xhr.status}\n${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during API communication"));
      xhr.send(formData);
    });
  }
}

// Mode B: Google Gemini API Provider (1.5 Flash Inline - CORS Friendly)
export class GeminiProvider extends TranscriptionProvider {
  async transcribe(file, apiKey, onProgress) {
    if (!apiKey) {
      throw new Error("API Key is required for Google Gemini transcription.");
    }
    
    // Diagnostic log (safe: only prints length and prefix to verify autofill status)
    console.log(`[Gemini API] Request initiated. Key length: ${apiKey.length}, Prefix: ${apiKey.substring(0, 5)}...`);
    
    // Read file as base64
    if (typeof onProgress === 'function') onProgress(10);
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read audio file"));
      reader.readAsDataURL(file);
    });
    
    if (typeof onProgress === 'function') onProgress(50);
    
    const mimeType = file.type || "audio/wav";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Please transcribe this audio file. Output only the verbatim transcription. Do not summarize, format, or add conversational intros/outros." }
        ]
      }]
    };
    
    if (typeof onProgress === 'function') onProgress(75);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });
    
    if (typeof onProgress === 'function') onProgress(100);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini generateContent failed: ${response.status}\n${text}`);
    }
    
    const data = await response.json();
    try {
      return data.candidates[0].content.parts[0].text || "";
    } catch {
      throw new Error("Failed to extract transcription text from Gemini API response");
    }
  }
}

// Mode A Helper: Real-time browser microphone transcription
export class LocalSpeechSession {
  constructor(onText, onError, onEnd) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "th-TH"; // Default to Thai, fallback to English if needed
    
    this.recognition.onresult = (e) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
      }
      if (finalTranscript && typeof onText === 'function') {
        onText(finalTranscript);
      }
    };
    
    this.recognition.onerror = (e) => {
      if (typeof onError === 'function') onError(e.error);
    };
    
    this.recognition.onend = () => {
      if (typeof onEnd === 'function') onEnd();
    };
  }
  
  start() {
    this.recognition.start();
  }
  
  stop() {
    this.recognition.stop();
  }
}
