import QueryLog from "../models/QueryLog.js";
import Document from "../models/Document.js";
import Conversation from "../models/Conversation.js";

/**
 * GET /api/dashboard/stats
 * Summary statistics for the admin dashboard
 */
export const getDashboardStats = async (req, res) => {
    try {
        const [totalDocuments, totalQueries, totalConversations, avgResponseTime] = await Promise.all([
            Document.countDocuments({ status: "indexed" }),
            QueryLog.countDocuments(),
            Conversation.countDocuments(),
            QueryLog.aggregate([{ $group: { _id: null, avg: { $avg: "$responseTimeMs" } } }]),
        ]);

        // Total chunks across all indexed documents
        const chunkAgg = await Document.aggregate([
            { $match: { status: "indexed" } },
            { $group: { _id: null, total: { $sum: "$totalChunks" } } },
        ]);
        const totalChunks = chunkAgg[0]?.total || 0;

        res.json({
            stats: {
                totalDocuments,
                totalChunks,
                totalQueries,
                totalConversations,
                avgResponseTimeMs: Math.round(avgResponseTime[0]?.avg || 0),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/dashboard/top-topics
 * Most queried topics (keywords from queries)
 */
export const getTopTopics = async (req, res) => {
    try {
        const queries = await QueryLog.find().select("query").limit(500);

        // Simple keyword frequency analysis
        const stopWords = new Set([
            "what", "how", "when", "where", "who", "which", "why", "is", "are", "was",
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "up", "about", "into", "through", "do",
            "does", "can", "could", "would", "should", "will", "have", "has", "had",
            "our", "my", "your", "their", "we", "i", "you", "it", "its",
        ]);

        const freq = {};
        queries.forEach(({ query }) => {
            query
                .toLowerCase()
                .replace(/[^a-z\s]/g, "")
                .split(/\s+/)
                .filter((w) => w.length > 3 && !stopWords.has(w))
                .forEach((word) => {
                    freq[word] = (freq[word] || 0) + 1;
                });
        });

        const topTopics = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([topic, count]) => ({ topic, count }));

        res.json({ topics: topTopics });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/dashboard/top-documents
 * Most referenced documents in AI responses
 */
export const getTopDocuments = async (req, res) => {
    try {
        const result = await QueryLog.aggregate([
            { $unwind: "$documentsReferenced" },
            { $group: { _id: "$documentsReferenced", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
            { $project: { documentName: "$_id", count: 1, _id: 0 } },
        ]);

        res.json({ documents: result });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/dashboard/query-volume
 * Query volume over the last 14 days
 */
export const getQueryVolume = async (req, res) => {
    try {
        const days = 14;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await QueryLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    queries: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { date: "$_id", queries: 1, _id: 0 } },
        ]);

        // Fill in missing dates with 0
        const dateMap = Object.fromEntries(result.map((r) => [r.date, r.queries]));
        const allDates = [];
        for (let i = days; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            allDates.push({ date: dateStr, queries: dateMap[dateStr] || 0 });
        }

        res.json({ volume: allDates });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/dashboard/recent-queries
 * Latest queries with user info
 */
export const getRecentQueries = async (req, res) => {
    try {
        const queries = await QueryLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select("query userName documentsReferenced isGuardrail createdAt");

        res.json({
            queries: queries.map((q) => ({
                id: q._id,
                query: q.query,
                user: q.userName || "Unknown",
                timestamp: q.createdAt,
                documentsReferenced: q.documentsReferenced,
                isGuardrail: q.isGuardrail,
            })),
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
