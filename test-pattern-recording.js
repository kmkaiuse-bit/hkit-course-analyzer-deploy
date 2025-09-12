/**
 * Test script for pattern recording functionality
 */

const PatternRecorder = require('./local/assets/js/db/pattern-recorder');
const dbConnection = require('./local/assets/js/db/connection');

async function testPatternRecording() {
    console.log('🧪 Testing Pattern Recording...');
    
    try {
        // Connect to database
        await dbConnection.connect();
        
        // Test 1: Record a new exemption decision
        console.log('\n📝 Test 1: Recording new exemption decision');
        const newPattern = await PatternRecorder.recordExemptionDecision(
            'HD403', 
            'Data Structures and Algorithms', 
            'exempted',
            'HD'
        );
        console.log('New pattern:', newPattern);
        
        // Test 2: Record same pattern again (should update counts)
        console.log('\n📝 Test 2: Recording same pattern again');
        const updatedPattern = await PatternRecorder.recordExemptionDecision(
            'HD403', 
            'Data Structures and Algorithms', 
            'rejected',
            'HD'
        );
        console.log('Updated pattern:', updatedPattern);
        
        // Test 3: Record analysis results (bulk)
        console.log('\n📝 Test 3: Recording bulk analysis results');
        const mockAnalysisResults = {
            exemptions: [
                { hkitSubject: 'IT201', previousSubject: 'Web Development', decision: 'exempted' },
                { hkitSubject: 'IT202', previousSubject: 'Database Design', decision: 'exempted' },
                { hkitSubject: 'BM401', previousSubject: 'Project Management', decision: 'rejected' }
            ]
        };
        
        const bulkPatterns = await PatternRecorder.recordAnalysisResults(
            mockAnalysisResults, 
            'IT'
        );
        console.log(`Recorded ${bulkPatterns.length} patterns from analysis`);
        
        // Test 4: Get learning statistics
        console.log('\n📊 Test 4: Getting learning statistics');
        const stats = await PatternRecorder.getLearningStats();
        console.log('Learning Stats:', stats);
        
        // Test 5: Test confidence calculation
        console.log('\n🧮 Test 5: Testing confidence calculations');
        console.log('Confidence (5 exempted, 1 rejected):', PatternRecorder.calculateConfidence(5, 1));
        console.log('Confidence (1 exempted, 1 rejected):', PatternRecorder.calculateConfidence(1, 1));
        console.log('Confidence (10 exempted, 2 rejected):', PatternRecorder.calculateConfidence(10, 2));
        
        // Test 6: Subject normalization
        console.log('\n🔤 Test 6: Testing subject normalization');
        console.log('Original: "Advanced C++ Programming!"');
        console.log('Normalized:', PatternRecorder.normalizeSubject('Advanced C++ Programming!'));
        console.log('Original: "Intro to AI & Machine Learning"');
        console.log('Normalized:', PatternRecorder.normalizeSubject('Intro to AI & Machine Learning'));
        
        console.log('\n✅ All pattern recording tests completed!');
        
    } catch (error) {
        console.error('❌ Pattern recording test failed:', error);
    } finally {
        await dbConnection.disconnect();
    }
}

// Run the test
testPatternRecording();