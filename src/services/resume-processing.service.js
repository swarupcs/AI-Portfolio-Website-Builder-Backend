import axios from 'axios';
import pkg from 'pdfjs-dist/legacy/build/pdf.js';
import mammoth from 'mammoth';
import Groq from 'groq-sdk';
import { GROQ_API_KEY } from '../config/config.js';

const groq = new Groq({ apiKey: GROQ_API_KEY });
const { getDocument } = pkg;
// Groq model options (free tier)
const GROQ_MODELS = {
  fast: 'llama-3.1-8b-instant', // Fastest, good for simple parsing
  balanced: 'llama-3.3-70b-versatile', // Best balance of speed/quality
  detailed: 'llama-3.3-70b-versatile', // Most detailed (using same as balanced since it's the best 70B available)
};

/**
 * 
 * Input: fileUrl (Cloudinary URL), fileFormat ("pdf" or "docx")
    Output: Cleaned text string
    Errors: File not found, timeout, unsupported format
 */
// Extract text from uploaded file
export const extractText = async (fileUrl, fileFormat) => {
  try {
    console.log(`📄 Extracting text from ${fileFormat} file: ${fileUrl}`);

    // 1. Download file from Cloudinary
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResumeParser/1.0)',
      },
    });

    // 2. Convert to buffer for processing
    const buffer = Buffer.from(response.data);
    let extractedText = '';

    // 3. Extract text based on file type
    switch (fileFormat?.toLowerCase()) {
      case 'pdf':
        // Use pdfjs-dist instead of pdf-parse
        extractedText = await extractTextFromPDF(buffer);
        break;

      case 'docx':
        const docxData = await mammoth.extractRawText({
          buffer,
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
          ],
        });
        extractedText = docxData.value;
        break;

      default:
        throw new Error(`Unsupported file format: ${fileFormat}`);
    }

    // 4. Clean and validate the text
    extractedText = cleanExtractedText(extractedText);

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error(
        'Extracted text is too short or empty. Please ensure the resume contains readable text.'
      );
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters`);
    return extractedText;
  } catch (error) {
    console.error('Text extraction error:', error);

    if (error.code === 'ECONNABORTED') {
      throw new Error('File download timeout. Please try with a smaller file.');
    } else if (error.response?.status === 404) {
      throw new Error('Resume file not found. Please upload again.');
    } else {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }
};


//  helper function for PDF text extraction:
const extractTextFromPDF = async (buffer) => {
  try {
    const data = new Uint8Array(buffer);
    const doc = await getDocument({ 
      data, 
      useSystemFonts: true,
      disableFontFace: true // Prevents font loading issues
    }).promise;
    
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};


/**
 * 
 * Why needed: PDFs often have weird formatting, extra spaces, special characters
Input: Raw extracted text
Output: Clean, readable text
 */
// Clean extracted text
const cleanExtractedText = (text) => {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s{2,}/g, ' ') // Remove excessive spaces
    .replace(/[^\S\n]{2,}/g, ' ') // Clean up whitespace
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .trim();
};

/**
 * Input: Extracted text + model preference
Output: Structured resume data + metadata
Key Features: Error handling, JSON validation, confidence scoring
 */
// Parse resume with Groq AI
export const parseWithAI = async (extractedText, model = 'balanced') => {
  try {
    console.log(`🤖 Parsing resume with Groq ${GROQ_MODELS[model]}...`);

    const startTime = Date.now();

    // 1. Select AI model
    // Select model based on preference
    const selectedModel = GROQ_MODELS[model] || GROQ_MODELS.balanced;

    // 2. Create detailed prompts for AI
    const systemPrompt = `You are an expert resume parser AI. Your job is to extract structured information from resume text and return it as valid JSON.

IMPORTANT RULES:
1. Return ONLY valid JSON - no explanations, no markdown, no extra text
2. Use exact field names as specified in the schema
3. Use null for missing information, never use undefined or empty strings
4. Parse dates in readable format (e.g., "Jan 2020", "2019-2021")
5. Extract ALL skills mentioned in the resume
6. Separate technical skills from soft skills
7. Extract achievements as separate items
8. Include technologies used in each role/project

SKILLS CATEGORIZATION:
- Technical: Programming languages, frameworks, tools, software, databases, cloud services
- Soft: Leadership, communication, teamwork, problem-solving, etc.
- Languages: English, Spanish, French, etc.

EXPERIENCE PARSING:
- Extract start/end dates separately
- Mark current roles with "current": true
- Pull out key achievements into achievements array
- Identify technologies mentioned in job descriptions`;

    const userPrompt = `Parse this resume text and return structured JSON:

${extractedText}

Return JSON in this EXACT format:
{
  "structured": {
    "personalInfo": {
      "name": "string or null",
      "email": "string or null", 
      "phone": "string or null",
      "location": "string or null",
      "linkedin": "string or null",
      "github": "string or null",
      "website": "string or null"
    },
    "summary": "string or null",
    "skills": {
      "technical": ["array of technical skills"],
      "soft": ["array of soft skills"],
      "languages": ["array of languages"]
    },
    "experience": [
      {
        "company": "string or null",
        "position": "string or null", 
        "location": "string or null",
        "startDate": "string or null",
        "endDate": "string or null",
        "current": boolean,
        "description": "string or null",
        "achievements": ["array of achievements"],
        "technologies": ["array of technologies used"]
      }
    ],
    "education": [
      {
        "institution": "string or null",
        "degree": "string or null",
        "field": "string or null", 
        "location": "string or null",
        "startDate": "string or null",
        "endDate": "string or null",
        "gpa": "string or null",
        "honors": ["array of honors"]
      }
    ],
    "projects": [
      {
        "name": "string or null",
        "description": "string or null",
        "technologies": ["array of technologies"],
        "url": "string or null",
        "github": "string or null", 
        "startDate": "string or null",
        "endDate": "string or null"
      }
    ],
    "certifications": [
      {
        "name": "string or null",
        "issuer": "string or null",
        "date": "string or null",
        "expiryDate": "string or null",
        "credentialId": "string or null"
      }
    ]
  }
}`;

    // 3. Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: selectedModel,
      temperature: 0.1, // Low temperature for consistent parsing
      max_tokens: 4000,
      top_p: 0.9,
      stream: false,
    });

    const processingTime = Date.now() - startTime;
    const responseText = completion.choices[0].message.content.trim();

    // 4. Parse AI response JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (jsonError) {
      // Try to extract JSON from response if wrapped in markdown or other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          throw new Error('Invalid JSON response from AI');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate structure
    if (!parsedData.structured) {
      throw new Error('Missing structured data in AI response');
    }

    // 5. Enhance and validate the data
    const enhancedData = enhanceAndValidateData(parsedData.structured);

    // 6. Calculate confidence score based on completeness
    const confidence = calculateConfidence(enhancedData);

    console.log(
      `✅ Groq parsing completed in ${processingTime}ms with ${confidence}% confidence`
    );

    // 7. Return structured result
    return {
      structured: enhancedData,
      confidence: confidence,
      processingTime: processingTime,
      tokensUsed: completion.usage?.total_tokens || null,
      model: selectedModel,
    };
  } catch (error) {
    console.error('Groq AI parsing error:', error);

    if (error.message?.includes('rate_limit_exceeded')) {
      throw new Error(
        'AI service rate limit reached. Please try again in a few moments.'
      );
    } else if (error.message?.includes('insufficient_quota')) {
      throw new Error('AI service quota exceeded. Please contact support.');
    } else if (error.message?.includes('context_length_exceeded')) {
      throw new Error('Resume is too long. Please try with a shorter resume.');
    } else {
      throw new Error(`AI parsing failed: ${error.message}`);
    }
  }
};

/**
 * Why needed: AI sometimes misses fields or returns wrong data types
Input: Raw AI response
Output: Validated, complete data structure
 */
// Enhance and validate parsed data
const enhanceAndValidateData = (structured) => {
  // 1. Create template with all required fields
  // Ensure all required fields exist with proper defaults
  const enhanced = {
    personalInfo: {
      name: structured.personalInfo?.name || null,
      email: structured.personalInfo?.email || null,
      phone: structured.personalInfo?.phone || null,
      location: structured.personalInfo?.location || null,
      linkedin: structured.personalInfo?.linkedin || null,
      github: structured.personalInfo?.github || null,
      website: structured.personalInfo?.website || null,
    },
    summary: structured.summary || null,
    skills: {
      technical: Array.isArray(structured.skills?.technical)
        ? structured.skills.technical
        : [],
      soft: Array.isArray(structured.skills?.soft)
        ? structured.skills.soft
        : [],
      languages: Array.isArray(structured.skills?.languages)
        ? structured.skills.languages
        : [],
    },
    experience: Array.isArray(structured.experience)
      ? structured.experience.map((exp) => ({
          company: exp.company || null,
          position: exp.position || null,
          location: exp.location || null,
          startDate: exp.startDate || null,
          endDate: exp.endDate || null,
          current: Boolean(exp.current),
          description: exp.description || null,
          achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
          technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
        }))
      : [],
    education: Array.isArray(structured.education)
      ? structured.education.map((edu) => ({
          institution: edu.institution || null,
          degree: edu.degree || null,
          field: edu.field || null,
          location: edu.location || null,
          startDate: edu.startDate || null,
          endDate: edu.endDate || null,
          gpa: edu.gpa || null,
          honors: Array.isArray(edu.honors) ? edu.honors : [],
        }))
      : [],
    projects: Array.isArray(structured.projects)
      ? structured.projects.map((proj) => ({
          name: proj.name || null,
          description: proj.description || null,
          technologies: Array.isArray(proj.technologies)
            ? proj.technologies
            : [],
          url: proj.url || null,
          github: proj.github || null,
          startDate: proj.startDate || null,
          endDate: proj.endDate || null,
        }))
      : [],
    certifications: Array.isArray(structured.certifications)
      ? structured.certifications.map((cert) => ({
          name: cert.name || null,
          issuer: cert.issuer || null,
          date: cert.date || null,
          expiryDate: cert.expiryDate || null,
          credentialId: cert.credentialId || null,
        }))
      : [],
  };

  // Additional enhancements
  // 2. Remove duplicate skills
  enhanced.skills.technical = deduplicateSkills(enhanced.skills.technical);
  enhanced.skills.soft = deduplicateSkills(enhanced.skills.soft);
  enhanced.skills.languages = deduplicateSkills(enhanced.skills.languages);

  return enhanced;
};

/**
 * Purpose: Removes duplicate skills (case-insensitive)
 * Example: ["JavaScript", "javascript", "JS"] → ["JavaScript"]
 */
// Remove duplicate skills (case-insensitive)
const deduplicateSkills = (skills) => {
  const seen = new Set();
  return skills.filter((skill) => {
    const lowerSkill = skill?.toLowerCase();
    if (!lowerSkill || seen.has(lowerSkill)) {
      return false; // Skip duplicates
    }
    seen.add(lowerSkill);
    return true; // Keep unique skills
  });
};

/**
 * Purpose: Calculates how complete/accurate the parsed data is (0-100%)
 * Scoring breakdown:

    - Personal Info: 30% (name=10, email=10, phone=5, location=5)
    - Experience: 25% (has experience=15, achievements=5, tech=5)
    - Skills: 20% (technical=15, soft=3, languages=2)
    - Education: 15% (has education=10, complete info=5)
    - Summary: 5%
    - Projects: 5%
 */
// Calculate confidence score based on data completeness
export const calculateConfidence = (structured) => {
  let score = 0;
  let maxScore = 0;

  // Personal info scoring (30 points)
  maxScore += 30;
  const personalInfo = structured.personalInfo || {};
  if (personalInfo.name) score += 10;
  if (personalInfo.email) score += 10;
  if (personalInfo.phone) score += 5;
  if (personalInfo.location) score += 5;

  // Experience scoring (25 points)
  maxScore += 25;
  const experience = structured.experience || [];
  if (experience.length > 0) {
    score += 15;
    if (
      experience.some((exp) => exp.achievements && exp.achievements.length > 0)
    )
      score += 5;
    if (
      experience.some((exp) => exp.technologies && exp.technologies.length > 0)
    )
      score += 5;
  }

  // Skills scoring (20 points)
  maxScore += 20;
  const skills = structured.skills || {};
  if (skills.technical && skills.technical.length > 0) score += 15;
  if (skills.soft && skills.soft.length > 0) score += 3;
  if (skills.languages && skills.languages.length > 0) score += 2;

  // Education scoring (15 points)
  maxScore += 15;
  const education = structured.education || [];
  if (education.length > 0) {
    score += 10;
    if (education.some((edu) => edu.degree && edu.institution)) score += 5;
  }

  // Summary scoring (5 points)
  maxScore += 5;
  if (structured.summary && structured.summary.length > 20) score += 5;

  // Projects scoring (5 points)
  maxScore += 5;
  const projects = structured.projects || [];
  if (projects.length > 0) score += 5;

  return Math.round((score / maxScore) * 100);
};

// Generate enhanced summary (optional utility)
/**
 * Purpose: Creates a professional summary if one doesn't exist
 * When to use: When original resume lacks a summary section
 */
export const generateEnhancedSummary = async (
  structuredData,
  targetRole = null
) => {
  // 1. Extract key info
  try {
    const skills = [
      ...(structuredData.skills?.technical || []),
      ...(structuredData.skills?.soft || []),
    ]
      .slice(0, 8)
      .join(', ');

    const experience = structuredData.experience?.length || 0;
    const education = structuredData.education?.[0]?.degree || 'degree';

    // 2. Create prompt for summary generation
    const prompt = `Based on this professional profile, generate a compelling 2-3 sentence professional summary ${
      targetRole ? `tailored for a ${targetRole} role` : ''
    }:

Skills: ${skills}
Years of Experience: ${experience} roles
Education: ${education}
Current Summary: ${structuredData.summary || 'Not provided'}

Generate a professional summary that highlights key strengths and career focus.`;

    // 3. Use fast model for quick summary
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODELS.fast, // Use fast model for summary generation
      temperature: 0.3, // Slightly creative
      max_tokens: 150,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    return null;
  }
};

/**
 * Purpose: Finds technical skills mentioned in text that AI might have missed
 * Use case: Backup skill extraction when AI parsing misses obvious skills
 */
// Extract additional skills from text (utility function)
export const extractAdditionalSkills = (extractedText) => {
  try {
    // 1. Predefined list of common skills
    // Common technical skills to look for
    const commonSkills = [
      'JavaScript',
      'Python',
      'Java',
      'React',
      'Node.js',
      'SQL',
      'MongoDB',
      'AWS',
      'Docker',
      'Kubernetes',
      'Git',
      'HTML',
      'CSS',
      'TypeScript',
      'Angular',
      'Vue.js',
      'Express',
      'Django',
      'Flask',
      'PostgreSQL',
      'Redis',
      'GraphQL',
      'REST API',
      'Microservices',
      'CI/CD',
      'Jenkins',
      'Linux',
      'Bash',
      'PowerShell',
      'Azure',
      'GCP',
      'Firebase',
      'Next.js',
      'Tailwind',
      'Bootstrap',
      'Sass',
      'Webpack',
      'Vite',
      'Jest',
      'Cypress',
    ];

    // 2. Search text for each skill (case-insensitive)
    const text = extractedText.toLowerCase();
    const foundSkills = commonSkills.filter((skill) =>
      text.includes(skill.toLowerCase())
    );

    // 3. Return unique skills found
    return [...new Set(foundSkills)]; // Remove duplicates
  } catch (error) {
    console.error('Skill extraction error:', error);
    return [];
  }
};

/**
 *  Purpose: Tests if Groq API is working correctly
 * When to use: During app startup or debugging API issues
 */
// Test Groq connection
export const testGroqConnection = async () => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello, can you respond with "Connection successful"?',
        },
      ],
      model: GROQ_MODELS.fast,
      max_tokens: 10,
    });

    return {
      success: true,
      message: completion.choices[0].message.content,
      model: GROQ_MODELS.fast,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
