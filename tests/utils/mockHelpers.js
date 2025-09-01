/**
 * Test utility functions and mock helpers
 */

/**
 * Mock Gemini API response for successful analysis
 */
const mockSuccessfulGeminiResponse = {
  success: true,
  data: {
    text: JSON.stringify([
      {
        "HKIT Subject Code": "HD101",
        "HKIT Subject Name": "Introduction to Computing",
        "Exemption Granted / study plan": "Exempted",
        "Subject Name of Previous Studies": "Computer Programming I",
        "Exemption Granted": "TRUE",
        "Remarks": "Course content matches programming fundamentals"
      },
      {
        "HKIT Subject Code": "HD102",
        "HKIT Subject Name": "Database Systems",
        "Exemption Granted / study plan": "",
        "Subject Name of Previous Studies": "",
        "Exemption Granted": "FALSE",
        "Remarks": "No equivalent course found in transcript"
      }
    ])
  }
};

/**
 * Mock timeout error response
 */
const mockTimeoutResponse = {
  error: 'Failed to generate content',
  message: 'Request timeout - please try again with shorter input'
};

/**
 * Create mock PDF file for testing
 */
const createMockPDFFile = (name = 'test.pdf', size = 1024) => {
  const content = 'Mock PDF content '.repeat(Math.ceil(size / 16));
  const buffer = Buffer.from(content);
  
  return {
    name,
    size,
    type: 'application/pdf',
    arrayBuffer: jest.fn().mockResolvedValue(buffer.buffer),
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue(content)
  };
};

/**
 * Create mock small PDF (< 500KB)
 */
const createSmallMockPDF = () => createMockPDFFile('small-transcript.pdf', 400 * 1024);

/**
 * Create mock medium PDF (500KB - 2MB)
 */
const createMediumMockPDF = () => createMockPDFFile('medium-transcript.pdf', 1 * 1024 * 1024);

/**
 * Create mock large PDF (> 2MB)
 */
const createLargeMockPDF = () => createMockPDFFile('large-transcript.pdf', 5 * 1024 * 1024);

/**
 * Mock HTTP request/response for Vercel functions
 */
const createMockVercelRequest = (body = {}, method = 'POST') => ({
  method,
  body,
  headers: {
    'Content-Type': 'application/json'
  }
});

const createMockVercelResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis()
  };
  return res;
};

/**
 * Mock programme template for testing
 */
const mockProgrammeTemplate = {
  id: 'computing-bsc',
  name: 'Bachelor of Science in Computing',
  courses: [
    {
      code: 'HD101',
      name: 'Introduction to Computing',
      credits: 3
    },
    {
      code: 'HD102', 
      name: 'Database Systems',
      credits: 3
    },
    {
      code: 'HD401',
      name: 'English Communication',
      credits: 3
    }
  ]
};

/**
 * Generate test CSV for programme template
 */
const generateTestTemplateCSV = () => {
  return `HKIT Subject Code,HKIT Subject Name,Credits
HD101,Introduction to Computing,3
HD102,Database Systems,3
HD401,English Communication,3`;
};

/**
 * Sleep utility for testing timeouts
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock job ID generator
 */
const generateMockJobId = () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

module.exports = {
  mockSuccessfulGeminiResponse,
  mockTimeoutResponse,
  createMockPDFFile,
  createSmallMockPDF,
  createMediumMockPDF,
  createLargeMockPDF,
  createMockVercelRequest,
  createMockVercelResponse,
  mockProgrammeTemplate,
  generateTestTemplateCSV,
  sleep,
  generateMockJobId
};