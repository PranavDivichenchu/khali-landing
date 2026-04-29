const OpenAI = require("openai");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AIService {
    constructor() {
        this.provider = 'openai';

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) console.warn("⚠️ OPENAI_API_KEY is missing!");

        console.log("[AI Service] Initializing OpenAI (gpt-4o-mini)...");
        this.openai = new OpenAI({ apiKey });
        this.modelName = "gpt-4o-mini";
    }

    async generateEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.warn(`[AI Service] ⚠️ Embedding failed:`, error.message);
            return new Array(1536).fill(0);
        }
    }

    async optimizeArticle(item) {
        try {
            console.log(`[AI Service] Optimizing "${item.title}"...`);
            return await this._optimizeWithOpenAI(item);
        } catch (error) {
            console.error(`[AI Service] Optimization failed for "${item.title}":`, error.message);
            // Fallback to original
            return {
                ...item,
                title: item.title,
                summary: item.summary,
                audioScript: item.summary.join(". "), // Fallback script
                category: item.category || 'Current',
                leftPerspective: null,
                rightPerspective: null,
                claims: [],
                sampleQuestion: null,
                isOptimized: true
            };
        }
    }

    async synthesizeMultipleSources(articles) {
        try {
            console.log(`[AI Service] Synthesizing ${articles.length} sources...`);
            const prompt = this._getSynthesisPrompt(articles);

            const response = await this.openai.chat.completions.create({
                model: this.modelName,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });
            const text = response.choices[0].message.content;
            return this._parseSynthesisResponse(text, articles);

        } catch (error) {
            console.error(`[AI Service] ❌ Synthesis failed:`, error);
            if (error.response) {
                console.error(`[AI Service] OpenAI Response Data:`, error.response.data);
            }
            // Fallback
            const first = articles[0];
            return {
                title: first.title,
                summary: first.summary,
                category: first.category || 'Current',
                leftPerspective: null,
                rightPerspective: null,
                claim: "See full story for details.",
                sources: articles.map(a => ({
                    sourceAPI: a.sourceAPI,
                    iconURL: a.imageURL,
                    articleURL: a.articleURL,
                    originalTitle: a.title
                })),
                date: first.date
            };
        }
    }

    async _optimizeWithOpenAI(item) {
        const prompt = this._getPrompt(item);
        const response = await this.openai.chat.completions.create({
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        const text = response.choices[0].message.content;
        return this._parseResponse(text, item);
    }

    _getPrompt(item) {
        return `
            Task: Analyze and summarize this news article for a general audience.

            Original Headline: ${item.title}
            Original Summary: ${item.summary[0]}

            Requirements:
            1. FILTER CONTENT: This app is for high-quality news and substantial stories. Filter out spam, low-quality celebrity gossip, or clickbait.
            2. SET "isNews" to FALSE only if the article is purely entertainment gossip, obvious spam, or offensive.
            3. CATEGORIES: politics, technology, business, sports, entertainment, health, science, lifestyle, environment, world.
            4. HEADLINE: Short, sweet, and attention-grabbing (max 8 words).
            5. BULLETS: 4 ultra-short bullet points (8-12 words max). Use punchy language. Ensure the summary considers multiple perspectives and remains neutral/balanced.
            6. Create exactly 1 "CLAIM" question:
                - This must be a Provocative Yes/No debatable question about the story's core conflict or implication.
                - CRITICAL: The claim MUST NOT be the same as any of the bullet points. It should be a higher-level question.
            7. Create a "podcastDialogue" for "The AI Newsroom":
                 - Hosts: "Sarah" (Host, energetic, clear) and "Mike" (Co-host, slightly more cynical/analytical, adds context).
                 - Format: A conversation/debate. Not just reading the news.
                 - Interaction: NO INTRODUCTIONS. Jump straight into the headline or the core news event. Never start with "Today's news", "Headlines today", or "In our first story".
                 - Scripts: Return a JSON Array of objects: [{"speaker": "Sarah", "text": "..."}, {"speaker": "Mike", "text": "..."}]
                 - Length: 4-6 total turns (approx 100-140 words total).
                 - Tone: Like a high-quality tech/politics podcast.
                 - CRITICAL: Do NOT mention the hosts' names ("Sarah" or "Mike") in the dialogue.
                 - CRITICAL: Ensure every sentence ends with proper punctuation (., ?, !). Do not leave hanging clauses.
                 - CRITICAL: The VERY LAST turn must be one of the hosts speaking DIRECTLY to the viewer/listener. They MUST ask the EXACT "CLAIM" question generated above, word-for-word.
                 - CRITICAL: Do NOT paraphrase the claim. Use the exact text.
                 - CRITICAL: Return VALID JSON array in the podcastDialogue field.
            8. Create a "sampleQuestion":
                 - A short, curious question that a user might ask about this story to learn more.
                 - Example: "Who is the main person involved?" or "What are the implications of this?"
                 - Keep it under 10 words.

            9. Create a "visualContext" object for searching stock video on Pexels:
                 - "keywords": A string of 5-6 SPECIFIC, CONCRETE visual search terms describing what a camera would physically film. CRITICAL: NEVER use metaphors, idioms, or isolated abstract nouns (e.g., do NOT use "brick", "crash", or "bear"). ONLY output broad, safe, highly descriptive visual scenes (e.g., "construction site infrastructure heavy machinery", "hospital emergency room doctors", "stock market data center servers").
                 - "keywordsAlt": A SECOND alternative search string (5-6 words) using DIFFERENT broad visual synonyms as a backup.
                 - "mood": A single word describing the visual tone (e.g. "somber", "urgent", "technological", "bright").

            10. Output VALID JSON ONLY (No markdown formatting if possible, just the raw JSON string):
            {
              "isNews": true/false,
              "category": "...",
              "title": "...",
              "bullets": ["...", "...", "...", "..."],
              "claim": "...",
              "podcastDialogue": [{"speaker": "Sarah", "text": "..."}, {"speaker": "Mike", "text": "..."}],
              "sampleQuestion": "...",
              "visualContext": { "keywords": "...", "keywordsAlt": "...", "mood": "..." }
            }
        `;
    }

    _getSynthesisPrompt(articles) {
        const sourceTexts = articles.map((a, i) => `
            SOURCE ${i + 1}: ${a.sourceAPI}
            Original Title: ${a.title}
            Original Summary: ${a.summary.join('. ')}
        `).join('\n\n');

        return `
            Task: Synthesize these ${articles.length} news articles from UNIQUE publications into ONE neutral, unified story.

            ${sourceTexts}

            Requirements:
            1. HEADLINE: Short, sweet, and attention-grabbing (max 8 words).
            2. Create 4 ultra-short bullet points (8-12 words max). Use punchy language. Ensure the summary considers multiple perspectives and remains neutral/balanced.
            3. Create 1 "CLAIM" question (Yes/No debatetable question).
                - CRITICAL: The claim MUST NOT be the same as any of the bullet points.
            4. Create a "podcastDialogue" for "The AI Newsroom":
                - Hosts: "Sarah" (Host) and "Mike" (Co-host).
                - Content: Synthesize the multiple sources into a discussion.
                - Format: Start IMMEDIATELY with the news. No "Okay, we have a developing story", "First up", or "Today's news". Jump straight into the content.
                 - Scripts: JSON Array: [{"speaker": "Sarah", "text": "..."}, ...]
                 - CRITICAL: Ensure every sentence ends with proper punctuation (., ?, !).
                 - CRITICAL: Do NOT mention the hosts' names ("Sarah" or "Mike") in the dialogue. Use natural conversation without calling out names.
                 - CRITICAL: The VERY LAST turn must be one of the hosts speaking DIRECTLY to the audience. They MUST ask the EXACT "CLAIM" question generated above, word-for-word.
                 - CRITICAL: Do NOT paraphrase the claim. Use the exact text.
                 - Length: 4-6 turns.
            5. Determine best category from this list ONLY: politics, technology, business, sports, entertainment, health, science, lifestyle, environment, world.
            6. Create a "sampleQuestion" to encourage further inquiry (max 10 words).
            7. Create a "visualContext" object for searching stock video on Pexels:
                 - "keywords": 5-6 SPECIFIC, CONCRETE visual search terms. CRITICAL: NEVER use metaphors, idioms, or isolated nouns (e.g., do NOT use "brick" or "bear"). ONLY output broad, safe, highly descriptive visual scenes (e.g., "construction site infrastructure heavy machinery").
                 - "keywordsAlt": An alternative visual search string using different broad synonyms.
                 - "mood": A single word for visual tone.
            8. Output VALID JSON ONLY:
            {
              "category": "...",
              "title": "...",
              "bullets": ["...", "...", "...", "..."],
              "claim": "...",
              "podcastDialogue": [{"speaker": "Sarah", "text": "..."}, {"speaker": "Mike", "text": "..."}],
              "sampleQuestion": "...",
              "visualContext": { "keywords": "...", "keywordsAlt": "...", "mood": "..." }
            }
        `;
    }

    _parseSynthesisResponse(text, articles) {
        // Simple regex to extract JSON block if wrapped in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                title: result.title,
                summary: result.bullets,
                // Fallback Logic for old flow compatibility
                audioScript: result.audioScript || (result.podcastDialogue ? JSON.stringify(result.podcastDialogue) : result.bullets.join(". ")),
                podcastDialogue: result.podcastDialogue,
                category: result.category || 'Current',
                claim: result.claim,
                sampleQuestion: result.sampleQuestion,
                visualContext: result.visualContext,
                sources: articles.map(a => ({
                    sourceAPI: a.sourceAPI,
                    iconURL: a.imageURL,
                    articleURL: a.articleURL,
                    originalTitle: a.title
                })),
                date: articles[0].date
            };
        }
        throw new Error("Failed to parse synthesis response");
    }

    async generatePodcast(dialogue) {
        try {
            console.log(`[AI Service] 🎙️ Generating Podcast with ${dialogue.length} turns using OpenAI TTS...`);

            // Map speakers to Edge TTS voice names (used as keys throughout the pipeline)
            const VOICE_MAP = {
                "Sarah": "en-US-AriaNeural",
                "Mike": "en-US-GuyNeural"
            };

            const tempFiles = [];
            let masterCaptions = []; // Accumulate captions from all segments
            let currentOffset = 0;
            const ffmpeg = require('fluent-ffmpeg');

            // 1. Generate Audio Segments
            for (let i = 0; i < dialogue.length; i++) {
                const turn = dialogue[i];
                let text = turn.text;
                const voice = VOICE_MAP[turn.speaker] || "en-US-AriaNeural";

                if (!text) continue;

                // Enforce punctuation for better intonation
                if (!/[.?!]$/.test(text.trim())) {
                    text = text.trim() + ".";
                }

                // Use TTS (OpenAI primary, Edge TTS fallback)
                const { audio: buffer, marks } = await this.generateSpeechWithMarks(text, voice);

                // Save to temp file for ffmpeg
                const rawPath = path.join(__dirname, `../temp/pod_raw_${Date.now()}_${i}.mp3`);
                const trimPath = path.join(__dirname, `../temp/pod_trim_${Date.now()}_${i}.mp3`);

                if (!fs.existsSync(path.dirname(rawPath))) fs.mkdirSync(path.dirname(rawPath), { recursive: true });
                fs.writeFileSync(rawPath, buffer);

                // Trim silence using ffmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(rawPath)
                        .audioFilters([
                            'silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB',
                            'silenceremove=stop_periods=-1:stop_duration=0:stop_threshold=-50dB'
                        ])
                        .on('end', resolve)
                        .on('error', reject)
                        .save(trimPath);
                });

                // Clean up raw
                try { fs.unlinkSync(rawPath); } catch (e) { }

                tempFiles.push(trimPath);

                // Get duration of the trimmed segment
                const segmentDuration = await new Promise((resolve) => {
                    ffmpeg.ffprobe(trimPath, (err, metadata) => {
                        resolve(metadata?.format?.duration || 0);
                    });
                });

                // --- PROCESS CAPTIONS FOR THIS SEGMENT ---
                const speakerId = turn.speaker === "Sarah" ? 1 : 0; // Sarah=1, Mike=0

                // If marks are empty (fallback), do linear interpolation
                if (!marks || marks.length === 0) {
                    const words = text.trim().split(/\s+/);
                    const wordsPerSecond = words.length / segmentDuration;
                    const MAX_WORDS = 4;
                    for (let j = 0; j < words.length; j += MAX_WORDS) {
                        const chunkWords = words.slice(j, j + MAX_WORDS);
                        const start = currentOffset + (j / words.length) * segmentDuration;
                        const end = currentOffset + ((j + chunkWords.length) / words.length) * segmentDuration;
                        masterCaptions.push({
                            text: chunkWords.join(' '),
                            start: start,
                            end: end,
                            speakerId: speakerId
                        });
                    }
                } else {
                    // Use PRECISE timestamps
                    let chunkBuffer = [];
                    marks.forEach((mark, mIndex) => {
                        // mark: { word: string, offset: number (100ns), duration: number (100ns) }
                        const wordStart = currentOffset + (mark.offset / 1e7);
                        const wordEnd = currentOffset + ((mark.offset + mark.duration) / 1e7);

                        chunkBuffer.push({ word: mark.word, start: wordStart, end: wordEnd });

                        // Close chunk if full or is last or punctuation
                        if (chunkBuffer.length >= 4 || /[.?!]$/.test(mark.word) || mIndex === marks.length - 1) {
                            const chunkText = chunkBuffer.map(w => w.word).join(' '); // edge-tts usually trims
                            masterCaptions.push({
                                text: chunkText,
                                start: chunkBuffer[0].start,
                                end: chunkBuffer[chunkBuffer.length - 1].end,
                                speakerId: speakerId
                            });
                            chunkBuffer = [];
                        }
                    });
                }

                currentOffset += segmentDuration;
            }

            if (tempFiles.length === 0) throw new Error("No audio segments generated");

            // 2. Stitch with ffmpeg
            return new Promise((resolve, reject) => {
                const outputId = Math.random().toString(36).substring(7);
                const outputPath = path.join(__dirname, `../temp/pod_full_${outputId}.mp3`);

                const cmd = ffmpeg();
                tempFiles.forEach(f => cmd.input(f));

                cmd.on('error', (err) => {
                    console.error('[AI Service] ffmpeg error:', err);
                    cleanup();
                    reject(err);
                })
                    .on('end', async () => {
                        // Return local path and accurate captions
                        console.log(`[AI Service] ✅ Podcast generated with ${masterCaptions.length} precise caption chunks`);
                        resolve({ audioPath: outputPath, captions: masterCaptions, segments: [] });
                    })
                    .mergeToFile(outputPath, path.join(__dirname, '../temp/')); // Second arg is temp dir

                function cleanup() {
                    try {
                        tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
                        // Do NOT delete outputPath here, caller will handle it.
                    } catch (e) { console.warn("Cleanup error", e); }
                }
            });

        } catch (error) {
            console.error(`[AI Service] ⚠️ Podcast generation failed:`, error.message);
            fs.appendFileSync('ai_error.log', `[${new Date().toISOString()}] Podcast Gen Error: ${error.message}\n${error.stack}\n`);
            // Disable fallback to avoid single-voice confusion
            // const flatText = dialogue.map(d => `${d.speaker} says: ${d.text}`).join(". ");
            // return await this.generateSpeech(flatText);
            throw error; // Let it fail so we know
        }
    }

    // _chunkCaptions removed as we now use precise timestamps


    async generateSpeech(text, voice = "en-US-AriaNeural") {
        const { audio } = await this.generateSpeechWithMarks(text, voice);
        return audio;
    }

    async generateSpeechWithMarks(text, voice = "en-US-AriaNeural") {
        // 1. Try OpenAI TTS first (primary — higher quality)
        try {
            console.log(`[AI Service] 🎙️ Attempting OpenAI TTS (primary)...`);
            const audio = await this._generateOpenAISpeech(text, voice);
            return { audio, marks: [] };
        } catch (openaiError) {
            console.warn(`[AI Service] ⚠️ OpenAI TTS failed (${openaiError.message}). Trying Edge TTS fallback...`);
        }

        // 2. Fallback: Edge TTS service
        try {
            const ttsUrl = process.env.TTS_SERVICE_URL || "http://localhost:5001/generate-with-marks";

            const response = await fetch(ttsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    voice,
                    speed: 1.15
                })
            });

            if (response.ok) {
                const data = await response.json();
                const audioBuffer = Buffer.from(data.audio, 'base64');
                console.log(`[AI Service] ✅ Generated speech using Edge TTS fallback`);
                return { audio: audioBuffer, marks: data.marks || [] };
            } else {
                // Try old endpoint if new one not found (migration safety)
                if (response.status === 404) {
                    console.warn("[AI Service] /generate-with-marks not found, falling back to /generate (no timestamps)");
                    const fallbackUrl = process.env.TTS_SERVICE_URL ? process.env.TTS_SERVICE_URL.replace('generate-with-marks', 'generate') : "http://localhost:5001/generate";
                    const fbResponse = await fetch(fallbackUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text, voice, speed: 1.15 })
                    });
                    if (fbResponse.ok) {
                        const ab = await fbResponse.arrayBuffer();
                        console.log(`[AI Service] ✅ Generated speech using Edge TTS /generate fallback`);
                        return { audio: Buffer.from(ab), marks: [] };
                    }
                }

                throw new Error(`Edge TTS Service returned ${response.status}`);
            }
        } catch (edgeError) {
            console.warn(`[AI Service] ⚠️ Edge TTS fallback also failed (${edgeError.message}).`);
        }

        // 3. Last resort: macOS 'say' command (dev only)
        if (process.platform === 'darwin') {
            try {
                console.log(`[AI Service] Trying macOS 'say' as last resort...`);
                const audio = await this._generateMacOSSpeech(text);
                return { audio, marks: [] };
            } catch (macError) {
                console.warn(`[AI Service] ⚠️ MacOS TTS also failed (${macError.message}).`);
            }
        }

        throw new Error("All TTS engines failed (OpenAI, Edge TTS, macOS)");
    }

    /**
     * Fallback for MacOS development environment.
     * Uses system 'say' command + ffmpeg to generate MP3.
     */
    async _generateMacOSSpeech(text) {
        if (process.platform !== 'darwin') {
            throw new Error("'say' command is only available on MacOS");
        }

        const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
        const id = Math.random().toString(36).substring(7);
        const aiffPath = path.join(__dirname, `../temp_${id}.aiff`);
        const mp3Path = path.join(__dirname, `../temp_${id}.mp3`);

        try {
            await exec(`say -v Samantha -r 180 -o "${aiffPath}" "${cleanText}"`);
            await exec(`ffmpeg -i "${aiffPath}" -acodec libmp3lame -ab 192k "${mp3Path}" -y`);

            if (fs.existsSync(mp3Path)) {
                const buffer = fs.readFileSync(mp3Path);
                fs.unlinkSync(aiffPath);
                fs.unlinkSync(mp3Path);
                console.log("[AI Service] ✅ Generated speech using MacOS fallback");
                return buffer;
            } else {
                throw new Error("FFmpeg output not found");
            }
        } catch (e) {
            console.error("[AI Service] MacOS TTS fallback failed:", e.message);
            if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);
            if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
            throw e;
        }
    }

    /**
     * OpenAI TTS (primary) — works on all platforms including Railway/Linux.
     * Maps Edge TTS voice names to OpenAI voice names.
     */
    async _generateOpenAISpeech(text, edgeVoice = "en-US-AriaNeural") {
        const VOICE_MAP = {
            "en-US-AriaNeural": "nova",    // Sarah — female, energetic
            "en-US-GuyNeural": "onyx",    // Mike  — male, deep
            "en-US-JennyNeural": "shimmer"  // generic female fallback
        };
        const openaiVoice = VOICE_MAP[edgeVoice] || "nova";

        console.log(`[AI Service] Generating speech via OpenAI TTS (voice: ${openaiVoice})...`);

        if (!this.openai || !process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI TTS fallback unavailable: missing API key");
        }

        const response = await this.openai.audio.speech.create({
            model: "tts-1-hd",
            voice: openaiVoice,
            input: text,
            speed: 1.15
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log("[AI Service] ✅ Generated speech using OpenAI TTS");
        return buffer;
    }

    async answerQuestion(question, item) {
        try {
            if (!this.openai || !process.env.OPENAI_API_KEY) {
                console.error("[AI Service] Missing OpenAI API Key");
                return "I'm sorry, I can't answer that right now (AI Configuration Missing).";
            }

            console.log(`[AI Service] Answering question for "${item.title}": ${question}`);
            const prompt = this._getQAPrompt(question, item);

            const response = await this.openai.chat.completions.create({
                model: this.modelName,
                messages: [{ role: "user", content: prompt }],
            });

            if (!response.choices || response.choices.length === 0) {
                throw new Error("Empty response from OpenAI");
            }

            return response.choices[0].message.content;

        } catch (error) {
            console.error(`[AI Service] Failed to answer question:`, error.message);
            if (error.response) {
                console.error(`[AI Service] OpenAI Response:`, JSON.stringify(error.response.data));
            }

            if (error.status === 401) return "Error: Authentication Failed. Please check server API keys.";
            if (error.status === 429) return "I'm receiving too many requests right now. Please try again in 30 seconds.";
            if (error.status === 500) return "OpenAI Service Error. Please try again later.";

            return "I'm sorry, I couldn't process that question right now due to a connection error.";
        }
    }

    _getQAPrompt(question, item) {
        // Safety check for item properties
        const title = item.title || "Unknown Article";

        let summary = "No summary available";
        if (Array.isArray(item.summary)) {
            summary = item.summary.join("\n");
        } else if (item.summary) {
            summary = String(item.summary);
        }

        let claims = "None";
        if (Array.isArray(item.claims)) {
            claims = item.claims.join("\n");
        } else if (item.claims) {
            claims = String(item.claims);
        }

        console.log(`[AI Service] Preparing QA prompt for item: ${item.id} (Title: ${title.substring(0, 30)}...)`);

        const prompt = `
            You are a smart, concise news assistant.

            Article Context:
            Title: ${title}
            Summary: ${summary}
            Claims: ${claims}

            User Question: ${question}

            Instructions:
            1. Answer the question directly and intelligently based on the context provided.
            2. USE YOUR GENERAL KNOWLEDGE to add context or explain concepts if the article is insufficient.
            3. KEEP IT SHORT. Maximum 3 sentences (approx 40 words).
            4. Be conversational but factual. Do not start with "Based on the article".
        `;

        return prompt;
    }

    _parseResponse(text, item) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const optimized = JSON.parse(jsonMatch[0]);

            if (optimized.isNews === false) {
                console.log(`[OpenAI] Filtered out non-news content: "${item.title}"`);
                return null;
            }

            console.log(`[OpenAI] Optimized successfully:`, optimized.title, `[${optimized.category}]`);
            return {
                ...item,
                title: optimized.title,
                summary: optimized.bullets || [item.summary[0]],
                // Store formatted script string for DB compatibility, but also keep raw structure if we can
                audioScript: optimized.podcastDialogue ? JSON.stringify(optimized.podcastDialogue) : optimized.audioScript,
                podcastDialogue: optimized.podcastDialogue,
                category: optimized.category || 'Current',
                claims: optimized.claim ? [optimized.claim] : [],
                sampleQuestion: optimized.sampleQuestion,
                visualContext: optimized.visualContext,
                isOptimized: true
            };
        }
        throw new Error(`Failed to parse JSON from OpenAI`);
    }
}

module.exports = new AIService();
