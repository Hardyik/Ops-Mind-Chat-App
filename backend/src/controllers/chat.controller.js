import Groq from "groq-sdk";
import Conversation from "../models/Conversation.js";
import Document from "../models/Document.js";
import QueryLog from "../models/QueryLog.js";

// Lazy init — reads GROQ_API_KEY after dotenv.config() runs
function getGroq() {
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

/**
 * Simple keyword-based chunk retrieval (RAG without vector DB)
 */
function retrieveRelevantChunks(query, documents, topK = 5) {
    const queryWords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
    const results = [];

    for (const doc of documents) {
        for (const chunk of doc.chunks) {
            const chunkText = chunk.text.toLowerCase();
            const score = queryWords.reduce((acc, word) => {
                return acc + (chunkText.includes(word) ? 1 : 0);
            }, 0);

            if (score > 0) {
                results.push({
                    documentId: doc._id,
                    documentName: doc.name,
                    pageNumber: chunk.pageNumber || 1,
                    snippet: chunk.text.slice(0, 200).trim(),
                    fullText: chunk.text,
                    score,
                });
            }
        }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * POST /api/chat/send
 */
export const sendMessage = async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const startTime = Date.now();

        if (!message?.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const groq = getGroq();

        // 1. Load indexed documents
        const allDocuments = await Document.find({ status: "indexed" });

        // 2. Retrieve relevant chunks
        const relevantChunks = retrieveRelevantChunks(message, allDocuments, 5);
        const hasContext = relevantChunks.length > 0;

        // 3. Build context & system prompt
        let contextText = "";
        if (hasContext) {
            contextText = relevantChunks
                .map((c, i) => `[Source ${i + 1}: ${c.documentName}, Page ${c.pageNumber}]\n${c.fullText}`)
                .join("\n\n---\n\n");
        }

        const systemPrompt = hasContext
            ? `You are OpsMind AI, a helpful corporate knowledge assistant for Infotact Solutions employees.
You answer questions based ONLY on the provided company documents. Be professional, concise, and accurate.
Always cite the source documents in your answer when referencing specific information.

COMPANY DOCUMENTS:
${contextText}

IMPORTANT RULES:
- Only answer based on the documents above
- If the answer is not in the documents, say you don't have that information
- Be concise but thorough
- Use markdown formatting (bold, bullet points) where helpful`
            : `You are OpsMind AI, a helpful corporate knowledge assistant for Infotact Solutions.
You don't have any relevant company documents for this question. Politely explain that the information isn't available in the indexed knowledge base and suggest the user contact HR or their manager for this query.
Keep your response brief and professional.`;

        // 4. Call Groq API (llama-3.3-70b — fast, powerful, free)
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
            temperature: 0.3,
            max_tokens: 1024,
        });

        const aiResponse = completion.choices[0].message.content;
        const responseTimeMs = Date.now() - startTime;

        // 5. Build citations
        const citations = hasContext
            ? relevantChunks.map((c) => ({
                documentId: c.documentId,
                documentName: c.documentName,
                pageNumber: c.pageNumber,
                snippet: c.snippet,
            }))
            : [];

        // 6. Generate follow-up questions (best-effort)
        let suggestedQuestions = [];
        if (hasContext) {
            try {
                const followUp = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "user",
                            content: `Based on this Q&A, suggest 3 short follow-up questions an employee might ask.
Return ONLY a JSON array of strings, nothing else.
Q: ${message}
A: ${aiResponse}`,
                        },
                    ],
                    temperature: 0.5,
                    max_tokens: 200,
                });
                const followUpText = followUp.choices[0].message.content.trim();
                const jsonMatch = followUpText.match(/\[.*\]/s);
                if (jsonMatch) {
                    suggestedQuestions = JSON.parse(jsonMatch[0]).slice(0, 3);
                }
            } catch (_) {
                // Optional — ignore
            }
        }

        // 7. Save/update conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }
        if (!conversation) {
            conversation = new Conversation({
                title: message.slice(0, 60),
                userId: req.user._id,
                messages: [],
            });
        }

        conversation.messages.push({ role: "user", content: message, timestamp: new Date() });
        conversation.messages.push({
            role: "assistant",
            content: aiResponse,
            citations,
            isGuardrail: !hasContext,
            suggestedQuestions,
            timestamp: new Date(),
        });

        await conversation.save();

        // 8. Log query for analytics
        await QueryLog.create({
            query: message,
            userId: req.user._id,
            userName: req.user.name,
            documentsReferenced: [...new Set(citations.map((c) => c.documentName))],
            isGuardrail: !hasContext,
            responseTimeMs,
            conversationId: conversation._id,
        });

        res.json({
            conversationId: conversation._id,
            message: {
                id: conversation.messages[conversation.messages.length - 1]._id,
                role: "assistant",
                content: aiResponse,
                citations,
                isGuardrail: !hasContext,
                suggestedQuestions,
                timestamp: new Date(),
            },
        });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ message: "Failed to get AI response", error: err.message });
    }
};

/**
 * GET /api/chat/conversations
 */
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({ userId: req.user._id })
            .select("title createdAt updatedAt messages")
            .sort({ updatedAt: -1 });

        const convList = conversations.map((c) => ({
            id: c._id,
            title: c.title,
            messageCount: c.messages.length,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        res.json({ conversations: convList });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/chat/conversations/:id
 */
export const getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json({ conversation });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * DELETE /api/chat/conversations/:id
 */
export const deleteConversation = async (req, res) => {
    try {
        await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: "Conversation deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
