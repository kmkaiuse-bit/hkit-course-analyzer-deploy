/**
 * Learning Database API Server
 * Express.js server to bridge browser frontend with PostgreSQL learning database
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import learning modules
const LearningEngine = require('../local/assets/js/db/learning-engine');
const PatternRetriever = require('../local/assets/js/db/pattern-retriever');
const PatternRecorder = require('../local/assets/js/db/pattern-recorder');
const dbConnection = require('../local/assets/js/db/connection');

const app = express();
const PORT = process.env.LEARNING_SERVER_PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'null'], // Allow local development
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from local directory
app.use('/static', express.static(path.join(__dirname, '../local')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const health = await dbConnection.healthCheck();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            server: 'learning-api',
            database: health
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get learning system status
app.get('/api/learning/status', async (req, res) => {
    try {
        const status = await LearningEngine.getSystemStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get learning context for subjects (Stage 1)
app.post('/api/learning/context', async (req, res) => {
    try {
        const { subjects, programmeContext } = req.body;
        
        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subjects array provided'
            });
        }

        console.log(`🔍 Getting learning context for ${subjects.length} subjects`);
        
        const learningContext = await LearningEngine.gatherLearningContext(subjects, programmeContext);
        
        res.json({
            success: true,
            data: learningContext,
            subjectCount: subjects.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Context error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhance prompt with learning patterns (Stage 2)
app.post('/api/learning/enhance', async (req, res) => {
    try {
        const { prompt, programmeContext } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'No prompt provided'
            });
        }

        console.log('🎯 Enhancing prompt with learning patterns');
        
        const enhancedPrompt = await LearningEngine.enhanceAnalysisPrompt(prompt, programmeContext);
        
        res.json({
            success: true,
            data: {
                originalPrompt: prompt,
                enhancedPrompt: enhancedPrompt,
                enhanced: enhancedPrompt.length > prompt.length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Enhancement error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Record analysis results for learning (Post-Stage 2)
app.post('/api/learning/record', async (req, res) => {
    try {
        const { analysisResults, programmeContext } = req.body;
        
        if (!analysisResults || !Array.isArray(analysisResults)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid analysis results provided'
            });
        }

        console.log(`📊 Recording ${analysisResults.length} exemption decisions`);
        
        const recordedPatterns = await LearningEngine.recordAnalysisResults(analysisResults, programmeContext);
        
        res.json({
            success: true,
            data: {
                recordedPatterns: recordedPatterns?.length || 0,
                patterns: recordedPatterns
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Recording error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get dashboard statistics
app.get('/api/learning/dashboard', async (req, res) => {
    try {
        const dashboardStats = await PatternRetriever.getDashboardStats();
        const recentPatterns = await dbConnection.query(`
            SELECT 
                hkit_subject,
                previous_subject,
                confidence,
                programme_context,
                last_updated
            FROM exemption_patterns 
            ORDER BY last_updated DESC 
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                stats: dashboardStats,
                recentActivity: recentPatterns.rows,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get relevant patterns for specific subjects
app.post('/api/learning/patterns', async (req, res) => {
    try {
        const { subjects, minConfidence = 0.3 } = req.body;
        
        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subjects array provided'
            });
        }

        const patterns = await PatternRetriever.getRelevantPatterns(subjects, minConfidence);
        
        res.json({
            success: true,
            data: patterns,
            subjectCount: subjects.length,
            patternCount: Object.keys(patterns).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Patterns error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize server
async function startServer() {
    try {
        console.log('🚀 Initializing Learning Database API Server...');
        
        // Initialize learning system
        const initialized = await LearningEngine.initialize();
        
        if (!initialized) {
            console.warn('⚠️ Learning system initialization failed, but server will continue');
        } else {
            console.log('✅ Learning system initialized successfully');
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`\n🌟 Learning Database API Server Running!`);
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
            console.log(`📊 Status: http://localhost:${PORT}/api/learning/status`);
            console.log(`\n🎯 Ready to enhance your HKIT Course Analyzer!`);
            console.log(`📝 Open your enhanced.html and analyze transcripts to see learning in action.`);
        });
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Learning Database API Server...');
    try {
        await LearningEngine.cleanup();
        console.log('✅ Cleanup complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        process.exit(1);
    }
});

// Start the server
startServer();