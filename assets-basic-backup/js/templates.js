/**
 * HKIT Programme Templates
 * Contains course data for all available programmes
 * Extracted from official HKIT unified templates
 */

const PROGRAMME_TEMPLATES = {
    computing: {
        id: 'computing',
        name: 'Bachelor of Science (Hons) Computing',
        fullName: 'Bachelor of Science (Hons) Computing',
        category: 'degree',
        courses: [
            { code: 'COH425', name: 'Managing Data' },
            { code: 'COH426', name: 'Problem Solving with Programming' },
            { code: 'COM434', name: 'Computer Systems' },
            { code: 'COM437', name: 'Information and Systems Engineering' },
            { code: 'COM440', name: 'Web Design Development' },
            { code: 'COM537', name: 'Applied Programming' },
            { code: 'COM540', name: 'Databases and Web-based Info System' },
            { code: 'COM545', name: 'Responsible Computing' },
            { code: 'COM553', name: 'Group Project' },
            { code: 'COM556', name: 'User Experience Design' },
            { code: 'COM454', name: 'Game Asset Development' },
            { code: 'COM543', name: 'Internet and Mobile App Development' }
        ]
    },

    business: {
        id: 'business',
        name: 'Bachelor of Arts (Hons) Business Studies',
        fullName: 'Bachelor of Arts (Hons) Business Studies',
        category: 'degree',
        courses: [
            { code: 'BA40099E', name: 'Principle of Management' },
            { code: 'BA40094E', name: 'Professional Skills' },
            { code: 'BA40100E', name: 'Management in Practice' },
            { code: 'BA40102E', name: 'Introduction to Business Finance' },
            { code: 'BA40103E', name: 'Employability Skills' },
            { code: 'BA40101E', name: 'Analysis of Real World Issues' },
            { code: 'BA50083E', name: 'Marketing Theory and Practice' },
            { code: 'BA50084E', name: 'Advanced Presentation and Communication Skills' },
            { code: 'BA50085E', name: 'Business Negotiation in Practice' },
            { code: 'BA50038E', name: 'Organisational Behaviour' },
            { code: 'BA50081E', name: 'Leadership and Teams' },
            { code: 'BA50082E', name: 'Group Business Development Applied Project' }
        ]
    },

    cybersecurity: {
        id: 'cybersecurity',
        name: 'Higher Diploma - Cybersecurity',
        fullName: 'Higher Diploma of Science and Technology (Cyber Security Stream)',
        category: 'diploma',
        courses: [
            { code: 'HD401', name: 'Introduction to Academic English' },
            { code: 'GS407', name: 'Mathematics for Computer Science' },
            { code: 'CS402', name: 'Programming Principles' },
            { code: 'CS416', name: 'Computing' },
            { code: 'HD402', name: 'English for Communication in Workplace' },
            { code: 'HD405', name: 'Practical Chinese' },
            { code: 'CS404', name: 'Database System' },
            { code: 'CS403', name: 'Introduction to Networks and Computer Security' },
            { code: 'HD408', name: 'Professional Ethics in Information Technology' },
            { code: 'CS408', name: 'Artificial Intelligence' },
            { code: 'CS401', name: 'Computational Theory' },
            { code: 'CS407', name: 'Applied Cryptography' },
            { code: 'HD403', name: 'Project Skills' },
            { code: 'CS405', name: 'Data Structures and Algorithms' },
            { code: 'CS417', name: 'Ethical Hacking Skills' },
            { code: 'CS406', name: 'Web and Mobile Application Security' }
        ]
    },

    healthcare: {
        id: 'healthcare',
        name: 'Higher Diploma in Health Care',
        fullName: 'Higher Diploma in Health Care',
        category: 'diploma',
        courses: [
            { code: 'HC401', name: 'Introduction to Academic English (50 contact hours)' },
            { code: 'HC402', name: 'Project Skills (50 contact hours)' },
            { code: 'HC403', name: 'Introduction to Health and Wellbeing and Common Chronic Conditions and Basic Nursing Care (Part 1) (150 contact hours)' },
            { code: 'HC404', name: 'Introduction to Health and Wellbeing and Common Chronic Conditions and Basic Nursing Care (Part 1) (150 contact hours)' },
            { code: 'HC405', name: 'Introduction to Health and Wellbeing and Common Chronic Conditions and Basic Nursing Care (Part 2) (50 contact hours)' },
            { code: 'HC406', name: 'Policies and Advocacies in Health Settings (50 contact hours)' },
            { code: 'HC501', name: 'Introduction to Health Assessment (50 contact hours)' },
            { code: 'HC502', name: 'Health Emergencies and Protection Systems (50 contact hours)' },
            { code: 'HC503', name: 'Community Health and Health Promotion (50 contact hours)' },
            { code: 'HC504', name: 'Application of Mass Media in Health (50 contact hours)' },
            { code: 'HC505', name: 'Mental Health and Wellbeing Across the Lifespan (50 contact hours)' },
            { code: 'HC506', name: 'Introduction to Research in Health (50 contact hours)' }
        ]
    },

    telecommunications: {
        id: 'telecommunications',
        name: 'Higher Diploma in Telecommunications and Networking',
        fullName: 'Higher Diploma in Telecommunications and Networking',
        category: 'diploma',
        courses: [
            { code: 'COH425', name: 'Managing Data' },
            { code: 'COH426', name: 'Problem Solving with Programming' },
            { code: 'COM434', name: 'Computer Systems' },
            { code: 'COM437', name: 'Information and Systems Engineering' },
            { code: 'COM440', name: 'Web Design Development' },
            { code: 'COM537', name: 'Applied Programming' },
            { code: 'COM540', name: 'Databases and Web-based Info System' },
            { code: 'COM545', name: 'Responsible Computing' },
            { code: 'COM553', name: 'Group Project' },
            { code: 'COM556', name: 'User Experience Design' },
            { code: 'COM454', name: 'Game Asset Development' },
            { code: 'COM543', name: 'Internet and Mobile App Development' }
        ]
    },

    ai: {
        id: 'ai',
        name: 'Higher Diploma - Artificial Intelligence',
        fullName: 'Higher Diploma of Science and Technology (Artificial Intelligence)',
        category: 'diploma',
        courses: [
            { code: 'HD401', name: 'Introduction to Academic English' },
            { code: 'CS421', name: 'Fundamental of Machine Learning' },
            { code: 'CS402', name: 'Programming Principles' },
            { code: 'CS416', name: 'Computing' },
            { code: 'HD402', name: 'English for Communication in Workplace' },
            { code: 'HD405', name: 'Practical Chinese' },
            { code: 'CS404', name: 'Database System' },
            { code: 'CS422', name: 'Systems Engineering and Project Management' },
            { code: 'HD408', name: 'Professional Ethics in Information Technology' },
            { code: 'CS408', name: 'Artificial Intelligence' },
            { code: 'CS401', name: 'Computational Theory' },
            { code: 'CS423', name: 'Cloud, Distributed Architecture' },
            { code: 'HD403', name: 'Project Skills' },
            { code: 'CS405', name: 'Data Structures and Algorithms' },
            { code: 'CS424', name: 'Secure Software Development' },
            { code: 'CS425', name: 'Machine Learning' }
        ]
    }
};

/**
 * Helper functions for template management
 */
const TemplateManager = {
    /**
     * Get all available programmes
     * @returns {Array} Array of programme objects
     */
    getAllProgrammes() {
        return Object.values(PROGRAMME_TEMPLATES);
    },

    /**
     * Get programme by ID
     * @param {string} programmeId - Programme identifier
     * @returns {Object|null} Programme object or null if not found
     */
    getProgramme(programmeId) {
        return PROGRAMME_TEMPLATES[programmeId] || null;
    },

    /**
     * Get programme dropdown options
     * @returns {Array} Array of {value, label} objects
     */
    getProgrammeOptions() {
        return Object.values(PROGRAMME_TEMPLATES).map(programme => ({
            value: programme.id,
            label: programme.name,
            fullName: programme.fullName,
            courseCount: programme.courses.length
        }));
    },

    /**
     * Get courses for a specific programme
     * @param {string} programmeId - Programme identifier
     * @returns {Array} Array of course objects
     */
    getCourses(programmeId) {
        const programme = this.getProgramme(programmeId);
        return programme ? programme.courses : [];
    },

    /**
     * Generate template data in CSV format for Gemini
     * @param {string} programmeId - Programme identifier
     * @returns {string} CSV formatted template data
     */
    generateTemplateCSV(programmeId) {
        const programme = this.getProgramme(programmeId);
        if (!programme) return '';

        let csv = `HKIT Subject Code,HKIT Subject Name,Exemption Granted / study plan,Subject Name of Previous Studies\n`;
        
        programme.courses.forEach(course => {
            csv += `${course.code},${course.name},,,\n`;
        });

        return csv;
    },

    /**
     * Validate if a course code exists in any programme
     * @param {string} courseCode - Course code to validate
     * @returns {Object|null} Programme and course info if found
     */
    findCourseInProgrammes(courseCode) {
        for (const [programmeId, programme] of Object.entries(PROGRAMME_TEMPLATES)) {
            const course = programme.courses.find(c => c.code === courseCode);
            if (course) {
                return {
                    programmeId,
                    programmeName: programme.name,
                    course
                };
            }
        }
        return null;
    },

    /**
     * Get statistics about all programmes
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const programmes = this.getAllProgrammes();
        const totalCourses = programmes.reduce((sum, p) => sum + p.courses.length, 0);
        
        return {
            totalProgrammes: programmes.length,
            totalCourses,
            degreePrograms: programmes.filter(p => p.category === 'degree').length,
            diplomaPrograms: programmes.filter(p => p.category === 'diploma').length,
            averageCoursesPerProgramme: Math.round(totalCourses / programmes.length)
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROGRAMME_TEMPLATES, TemplateManager };
}
