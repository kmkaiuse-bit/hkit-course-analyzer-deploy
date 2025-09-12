/**
 * Test script for learning system integration with Gemini API
 */

// Test the learning engine directly (since browser integration needs HTML context)
const LearningEngine = require('./local/assets/js/db/learning-engine');
const PatternRecorder = require('./local/assets/js/db/pattern-recorder');
const PatternRetriever = require('./local/assets/js/db/pattern-retriever');

async function testLearningIntegration() {
    console.log('🧪 Testing Learning System Integration...');
    
    try {
        // Test 1: Initialize learning system
        console.log('\n🚀 Test 1: Initialize Learning Engine');
        const initialized = await LearningEngine.initialize();
        console.log('Learning engine initialized:', initialized);
        
        // Test 2: Mock Stage 1 - Extract subjects and gather context
        console.log('\n📋 Test 2: Stage 1 - Subject extraction with learning context');
        const mockExtractedSubjects = [
            'Critical Thinking',
            'Computer Programming Fundamentals',
            'Database Management Systems',
            'Web Development Technologies',
            'Business Communication'
        ];
        
        const learningContext = await LearningEngine.gatherLearningContext(
            mockExtractedSubjects, 
            'HD'
        );
        
        console.log('Learning context gathered:');
        console.log('  - Has learning data:', learningContext.hasLearningData);
        console.log('  - Subjects with patterns:', learningContext.totalSubjectsWithPatterns || 0);
        console.log('  - Total patterns found:', learningContext.totalPatterns || 0);
        
        // Test 3: Mock Stage 2 - Enhance prompt
        console.log('\n🎯 Test 3: Stage 2 - Prompt enhancement');
        const mockOriginalPrompt = `
HKIT Course Exemption Analysis - Higher Diploma in Information Technology

TEMPLATE COURSES:
HD401,General Education - Critical Thinking and Problem Solving
HD402,General Education - English and Communication
IT101,Computer Programming Fundamentals

TASK:
Analyze the student transcripts and determine exemption eligibility...
        `;
        
        const enhancedPrompt = await LearningEngine.enhanceAnalysisPrompt(
            mockOriginalPrompt, 
            'HD'
        );
        
        const hasEnhancement = enhancedPrompt.length > mockOriginalPrompt.length;
        console.log('Prompt enhanced:', hasEnhancement);
        if (hasEnhancement) {
            const enhancement = enhancedPrompt.substring(mockOriginalPrompt.length);
            console.log('Enhancement preview:', enhancement.substring(0, 200) + '...');
        }
        
        // Test 4: Mock Stage 2 Results - Record learning
        console.log('\n📊 Test 4: Stage 2 - Recording analysis results');
        const mockAnalysisResults = [
            {
                'HKIT Subject Code': 'HD401',
                'HKIT Subject Name': 'Critical Thinking and Problem Solving',
                'Exemption Granted / study plan': 'Exempted',
                'Subject Name of Previous Studies': 'Critical Thinking',
                'Exemption Granted': 'TRUE',
                'Remarks': 'Direct match with previous studies'
            },
            {
                'HKIT Subject Code': 'IT101',
                'HKIT Subject Name': 'Computer Programming Fundamentals',
                'Exemption Granted / study plan': '',
                'Subject Name of Previous Studies': 'Introduction to Programming',
                'Exemption Granted': 'FALSE',
                'Remarks': 'Content coverage insufficient'
            },
            {
                'HKIT Subject Code': 'HD402',
                'HKIT Subject Name': 'English and Communication',
                'Exemption Granted / study plan': 'Exempted',
                'Subject Name of Previous Studies': 'Business Communication',
                'Exemption Granted': 'TRUE',
                'Remarks': 'Equivalent communication course completed'
            }
        ];
        
        const recordedPatterns = await LearningEngine.recordAnalysisResults(
            mockAnalysisResults, 
            'HD'
        );
        
        console.log(`Recorded ${recordedPatterns ? recordedPatterns.length : 0} new patterns`);
        
        // Test 5: System status
        console.log('\n📈 Test 5: Learning system status');
        const systemStatus = await LearningEngine.getSystemStatus();
        console.log('System status:', systemStatus);
        
        // Test 6: Verify patterns were recorded
        console.log('\n✅ Test 6: Verify pattern recording worked');
        const verifyPatterns = await PatternRetriever.getRelevantPatterns([
            'Critical Thinking', 
            'Introduction to Programming',
            'Business Communication'
        ], 0.1);
        
        console.log('Found patterns for verification:');
        Object.keys(verifyPatterns).forEach(subject => {
            console.log(`  "${subject}": ${verifyPatterns[subject].patterns.length} patterns`);
        });
        
        console.log('\n🎉 All learning integration tests completed!');
        
    } catch (error) {
        console.error('❌ Learning integration test failed:', error);
    } finally {
        await LearningEngine.cleanup();
    }
}

// Run the test
testLearningIntegration();