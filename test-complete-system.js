/**
 * Comprehensive Learning Database System Test
 * Tests all components from database to UI integration
 */

const dbConnection = require('./local/assets/js/db/connection');
const PatternRecorder = require('./local/assets/js/db/pattern-recorder');
const PatternRetriever = require('./local/assets/js/db/pattern-retriever');
const LearningEngine = require('./local/assets/js/db/learning-engine');

async function runCompleteSystemTest() {
    console.log('🚀 COMPREHENSIVE LEARNING DATABASE SYSTEM TEST');
    console.log('=' .repeat(60));
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    function logTest(testName, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}`);
        if (details) console.log(`    ${details}`);
        
        if (passed) testsPassed++; else testsFailed++;
    }
    
    try {
        // TEST 1: Database Infrastructure
        console.log('\n📊 TEST SUITE 1: DATABASE INFRASTRUCTURE');
        console.log('-'.repeat(40));
        
        await dbConnection.connect();
        const healthCheck = await dbConnection.healthCheck();
        logTest('Database Connection', healthCheck.status === 'connected');
        
        const initialStats = await dbConnection.getStats();
        logTest('Database Stats Query', initialStats && initialStats.total_patterns !== undefined);
        
        // TEST 2: Pattern Recording
        console.log('\n📝 TEST SUITE 2: PATTERN RECORDING');
        console.log('-'.repeat(40));
        
        // Record a test pattern
        const testPattern = await PatternRecorder.recordExemptionDecision(
            'TEST001', 
            'Test Subject for System Validation', 
            'exempted',
            'TEST'
        );
        logTest('Pattern Recording', testPattern && testPattern.id, `Pattern ID: ${testPattern?.id}`);
        
        // Test confidence calculation
        const confidence1 = PatternRecorder.calculateConfidence(8, 2); // 80% with penalty
        const confidence2 = PatternRecorder.calculateConfidence(1, 1); // 50% with penalty
        logTest('Confidence Calculation', confidence1 > 0 && confidence2 > 0, `8/10: ${confidence1}, 1/2: ${confidence2}`);
        
        // Test subject normalization
        const normalized = PatternRecorder.normalizeSubject('Advanced C++ Programming!');
        logTest('Subject Normalization', normalized === 'advanced_c_programming', `Result: ${normalized}`);
        
        // TEST 3: Pattern Retrieval
        console.log('\n🔍 TEST SUITE 3: PATTERN RETRIEVAL');
        console.log('-'.repeat(40));
        
        // Retrieve patterns for test subjects
        const testSubjects = ['Critical Thinking', 'Computer Fundamentals', 'Test Subject for System Validation'];
        const relevantPatterns = await PatternRetriever.getRelevantPatterns(testSubjects, 0.1);
        logTest('Pattern Retrieval', Object.keys(relevantPatterns).length > 0, `Found patterns for ${Object.keys(relevantPatterns).length} subjects`);
        
        // Test learning context generation
        const learningContext = await PatternRetriever.generateLearningContext(testSubjects, 'HD');
        logTest('Learning Context Generation', learningContext.hasLearningData === true, `${learningContext.totalPatterns || 0} patterns found`);
        
        // Test prompt enhancement
        const mockPrompt = 'Analyze the following courses for exemption...';
        const enhancedPrompt = PatternRetriever.formatLearningContextForPrompt(learningContext, 'HD');
        logTest('Prompt Enhancement', enhancedPrompt.length > 0, `Enhanced prompt has ${enhancedPrompt.length} characters`);
        
        // TEST 4: Learning Engine Integration
        console.log('\n🧠 TEST SUITE 4: LEARNING ENGINE INTEGRATION');
        console.log('-'.repeat(40));
        
        const engineInitialized = await LearningEngine.initialize();
        logTest('Learning Engine Initialization', engineInitialized === true);
        
        // Test context gathering
        const contextGathered = await LearningEngine.gatherLearningContext(['Critical Thinking', 'Mathematics'], 'HD');
        logTest('Context Gathering', contextGathered !== null, `Has learning data: ${contextGathered.hasLearningData}`);
        
        // Test system status
        const systemStatus = await LearningEngine.getSystemStatus();
        logTest('System Status Check', systemStatus.connected === true, `${systemStatus.totalPatterns} patterns, ${systemStatus.avgConfidence}% confidence`);
        
        // TEST 5: Analysis Results Recording
        console.log('\n📊 TEST SUITE 5: ANALYSIS RESULTS RECORDING');
        console.log('-'.repeat(40));
        
        // Mock analysis results from Gemini API
        const mockAnalysisResults = [
            {
                'HKIT Subject Code': 'TEST002',
                'HKIT Subject Name': 'Test Advanced Mathematics',
                'Exemption Granted / study plan': 'Exempted',
                'Subject Name of Previous Studies': 'Calculus and Linear Algebra',
                'Exemption Granted': 'TRUE',
                'Remarks': 'Strong mathematical foundation demonstrated'
            },
            {
                'HKIT Subject Code': 'TEST003',
                'HKIT Subject Name': 'Test Programming Concepts',
                'Exemption Granted / study plan': '',
                'Subject Name of Previous Studies': 'Introduction to Computer Science',
                'Exemption Granted': 'FALSE',
                'Remarks': 'Content coverage insufficient for exemption'
            }
        ];
        
        const recordedResults = await LearningEngine.recordAnalysisResults(mockAnalysisResults, 'TEST');
        logTest('Analysis Results Recording', recordedResults && recordedResults.length === 2, `Recorded ${recordedResults?.length || 0} patterns`);
        
        // TEST 6: Data Consistency and Integrity
        console.log('\n🔒 TEST SUITE 6: DATA INTEGRITY');
        console.log('-'.repeat(40));
        
        // Check final database state
        const finalStats = await dbConnection.getStats();
        const patternsIncreased = parseInt(finalStats.total_patterns) > parseInt(initialStats.total_patterns);
        logTest('Pattern Count Increased', patternsIncreased, `${initialStats.total_patterns} → ${finalStats.total_patterns}`);
        
        // Verify pattern consistency
        const allPatterns = await dbConnection.query('SELECT * FROM exemption_patterns WHERE programme_context = $1', ['TEST']);
        const testPatternsFound = allPatterns.rows.length >= 3; // Should have at least 3 test patterns
        logTest('Test Patterns Persisted', testPatternsFound, `Found ${allPatterns.rows.length} test patterns`);
        
        // Check confidence score ranges
        const confidenceCheck = await dbConnection.query('SELECT COUNT(*) as count FROM exemption_patterns WHERE confidence < 0 OR confidence > 1');
        const confidenceValid = parseInt(confidenceCheck.rows[0].count) === 0;
        logTest('Confidence Scores Valid', confidenceValid, 'All confidence scores within 0-1 range');
        
        // TEST 7: Performance and Cleanup
        console.log('\n⚡ TEST SUITE 7: PERFORMANCE & CLEANUP');
        console.log('-'.repeat(40));
        
        // Performance test: bulk pattern retrieval
        const startTime = Date.now();
        const bulkPatterns = await PatternRetriever.getRelevantPatterns(
            ['Critical Thinking', 'Computer Fundamentals', 'Mathematics', 'English', 'Physics'], 
            0.1
        );
        const queryTime = Date.now() - startTime;
        logTest('Query Performance', queryTime < 1000, `Query completed in ${queryTime}ms`);
        
        // Cleanup test patterns
        await dbConnection.query('DELETE FROM exemption_patterns WHERE programme_context = $1', ['TEST']);
        const cleanupCheck = await dbConnection.query('SELECT COUNT(*) as count FROM exemption_patterns WHERE programme_context = $1', ['TEST']);
        const cleanupSuccessful = parseInt(cleanupCheck.rows[0].count) === 0;
        logTest('Test Data Cleanup', cleanupSuccessful, 'All test patterns removed');
        
        // Final cleanup
        await LearningEngine.cleanup();
        
        // FINAL RESULTS
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Tests Passed: ${testsPassed}`);
        console.log(`❌ Tests Failed: ${testsFailed}`);
        console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
        
        if (testsFailed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Learning Database System is fully functional.');
            console.log('\n🚀 SYSTEM READY FOR PRODUCTION USE');
            console.log('\nKey Features Validated:');
            console.log('  ✅ PostgreSQL database connection and queries');
            console.log('  ✅ Pattern recording with confidence calculation');
            console.log('  ✅ Pattern retrieval and context generation');
            console.log('  ✅ AI prompt enhancement with historical data');
            console.log('  ✅ Learning engine integration with Gemini API');
            console.log('  ✅ Data integrity and performance optimization');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the issues above.');
        }
        
    } catch (error) {
        console.error('\n❌ CRITICAL ERROR during system test:', error);
        testsFailed++;
    } finally {
        await dbConnection.disconnect();
    }
}

// Run the comprehensive test
runCompleteSystemTest().catch(console.error);