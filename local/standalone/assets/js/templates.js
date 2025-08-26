/**
 * HKIT Programme Templates - Local Version
 * Enhanced template management for local deployment
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
            { code: 'CS403', name: 'Introduction to Networks and Computer Security' }
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
            { code: 'BA40101E', name: 'Analysis of Real World Issues' }
        ]
    }
};

/**
 * Simple Template Manager
 */
const TemplateManager = {
    getProgramme(programmeId) {
        return PROGRAMME_TEMPLATES[programmeId] || null;
    },

    getProgrammeOptions() {
        return Object.values(PROGRAMME_TEMPLATES).map(programme => ({
            value: programme.id,
            label: programme.name,
            courseCount: programme.courses.length
        }));
    },

    generateTemplateCSV(programmeId) {
        const programme = this.getProgramme(programmeId);
        if (!programme) return '';

        let csv = `HKIT Subject Code,HKIT Subject Name,Exemption Granted / study plan,Subject Name of Previous Studies\n`;
        programme.courses.forEach(course => {
            csv += `${course.code},${course.name},,,\n`;
        });
        return csv;
    }
};

window.TemplateManager = TemplateManager;
