/**
 * Test script for pattern retrieval functionality
 */

const PatternRetriever = require('./local/assets/js/db/pattern-retriever');
const dbConnection = require('./local/assets/js/db/connection');

async function testPatternRetrieval() {
    console.log('🔍 Testing Pattern Retrieval...');
    
    try {
        // Connect to database
        await dbConnection.connect();
        
        // Test 1: Get relevant patterns for existing subjects
        console.log('\n📋 Test 1: Getting relevant patterns');
        const testSubjects = [
            'Critical Thinking',
            'Computer Fundamentals', 
            'Business Management',
            'Unknown Subject'  // This should have no matches
        ];
        
        const patterns = await PatternRetriever.getRelevantPatterns(testSubjects, 0.3);
        console.log('Found patterns for subjects:', Object.keys(patterns));
        
        Object.entries(patterns).forEach(([subject, data]) => {
            console.log(`\n"${subject}":`);
            data.patterns.forEach(pattern => {
                console.log(`  → ${pattern.hkitSubject} (confidence: ${pattern.confidence}, rate: ${Math.round(pattern.exemptionRate * 100)}%)`);
            });
        });
        
        // Test 2: Get top matching HKIT subjects
        console.log('\n🎯 Test 2: Getting top matching HKIT subjects');
        const topMatches = await PatternRetriever.getTopMatchingHKITSubjects(testSubjects, 5);
        console.log('Top HKIT subject matches:');
        topMatches.forEach(match => {
            console.log(`  ${match.hkitSubject}: ${match.avgConfidence.toFixed(2)} confidence, ${match.totalObservations} observations`);
        });
        
        // Test 3: Generate learning context
        console.log('\n🧠 Test 3: Generating learning context');
        const learningContext = await PatternRetriever.generateLearningContext(testSubjects, 'HD');
        console.log('Learning context summary:');
        console.log(`  - Has learning data: ${learningContext.hasLearningData}`);
        console.log(`  - Subjects with patterns: ${learningContext.totalSubjectsWithPatterns || 0}`);
        console.log(`  - Total patterns: ${learningContext.totalPatterns || 0}`);
        console.log(`  - High confidence patterns: ${learningContext.highConfidencePatterns || 0}`);
        
        // Test 4: Show AI prompt enhancement
        console.log('\n📝 Test 4: AI Prompt Enhancement');
        if (learningContext.promptEnhancement) {
            console.log('Generated prompt enhancement:');
            console.log(learningContext.promptEnhancement);
        } else {
            console.log('No prompt enhancement generated');
        }
        
        // Test 5: Dashboard statistics
        console.log('\n📊 Test 5: Dashboard Statistics');
        const dashStats = await PatternRetriever.getDashboardStats();
        console.log('Dashboard stats:', dashStats);
        
        // Test 6: Test with subjects that have no matches
        console.log('\n❌ Test 6: Testing with unknown subjects');
        const noMatchContext = await PatternRetriever.generateLearningContext([
            'Quantum Physics',
            'Ancient History',
            'Underwater Basket Weaving'
        ]);
        console.log('Context for unknown subjects:', {
            hasLearningData: noMatchContext.hasLearningData,
            message: noMatchContext.message
        });
        
        console.log('\n✅ All pattern retrieval tests completed!');
        
    } catch (error) {
        console.error('❌ Pattern retrieval test failed:', error);
    } finally {
        await dbConnection.disconnect();
    }
}

// Run the test
testPatternRetrieval();