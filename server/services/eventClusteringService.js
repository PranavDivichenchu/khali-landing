const dbService = require('./dbService');
const aiService = require('./aiService');

class EventClusteringService {
    constructor() {
        this.SIMILARITY_THRESHOLD = 0.55; // Lowered from 0.6 to be more inclusive of "same event, different title" stories
        this.TIME_WINDOW_HOURS = 48;    // Look back window for clusters
    }

    /**
     * Attempt to find a cluster for a new article or create one
     */
    /**
     * Attempt to find a cluster for a new article or create one
     */
    async identifyCluster(article) {
        try {
            console.log(`[Clustering] Identifying cluster for: "${article.title}"`);

            // 1. Generate embedding for current article
            const articleText = `${article.title}. ${article.summary[0] || ''}`;
            const articleEmbedding = await aiService.generateEmbedding(articleText);

            // 2. Use RPC to find matching clusters in the database
            const matches = await dbService.matchClusters(articleEmbedding, this.SIMILARITY_THRESHOLD, this.TIME_WINDOW_HOURS);

            if (matches && matches.length > 0) {
                const bestMatch = matches[0];
                const similarityScore = typeof bestMatch.similarity === 'number'
                    ? bestMatch.similarity.toFixed(2)
                    : parseFloat(bestMatch.similarity || 0).toFixed(2);
                console.log(`[Clustering] Matched existing cluster: ${bestMatch.id} (Similarity: ${similarityScore})`);
                return bestMatch.id;
            } else {
                // Create new cluster with this article's embedding as the representative
                console.log(`[Clustering] No match found. Creating new cluster.`);
                const newCluster = await this._createNewCluster(article, articleEmbedding);
                return newCluster.id;
            }
        } catch (error) {
            console.error(`[Clustering] Error identifying cluster:`, error.message);
            return null; // Fallback to no cluster
        }
    }

    async _getRecentClusters() {
        // Deprecated: No longer fetching all clusters into memory
        return [];
    }

    async _getClusterArticles(clusterId) {
        if (!dbService.supabase) return [];

        const { data, error } = await dbService.supabase
            .from('news_items')
            .select('*')
            .eq('cluster_id', clusterId);

        if (error) {
            console.error(`[Clustering] Error fetching cluster articles:`, error.message);
            return [];
        }
        return data || [];
    }

    async _createNewCluster(article, embedding) {
        const { data, error } = await dbService.supabase
            .from('event_clusters')
            .insert({
                representative_title: article.title,
                article_count: 0,
                representative_embedding: embedding, // Still store as JSON for legacy if needed
                representative_embedding_vector: embedding // Store as vector for RPC search
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Basic cosine similarity calculation
     */
    _cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}

module.exports = new EventClusteringService();
