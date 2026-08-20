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

// Mode B: Google Gemini API Provider (1.5 Flash File API)
export class GeminiProvider extends TranscriptionProvider {
  async transcribe(file, apiKey, onProgress) {
    if (!apiKey) {
      throw new Error("API Key is required for Google Gemini transcription.");
    }

    const mimeType = file.type || "audio/wav";
    const boundary = "foo_bar_boundary";
    const metadata = JSON.stringify({ file: { displayName: file.name } });
    
    const parts = [
      `--${boundary}\r\n`,
      `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
      metadata,
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`
    ];
    
    const bodyBlob = new Blob(parts, { type: `multipart/related; boundary=${boundary}` });
    
    // Upload using XHR to track progress
    const uploadResult = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}&uploadType=multipart`);
      xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`);
      xhr.setRequestHeader("X-Goog-Upload-Protocol", "multipart");
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') {
          // Reserve the last 20% for server transcription processing
          const pct = Math.round((e.loaded / e.total) * 80);
          onProgress(pct);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Failed to parse file upload response"));
          }
        } else {
          reject(new Error(`File upload failed: ${xhr.status} ${xhr.statusText}\n${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error("Network error during file upload to Gemini"));
      xhr.send(bodyBlob);
    });
    
    if (typeof onProgress === 'function') onProgress(85);
    
    // Call generateContent referencing the uploaded file uri
    const fileUri = uploadResult.file.uri;
    const fileMime = uploadResult.file.mimeType;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { fileData: { fileUri: fileUri, mimeType: fileMime } },
            { text: "Please transcribe this audio file. Output only the verbatim transcription. Do not summarize, format, or add conversational intros/outros." }
          ]
        }]
      })
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
