import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define a type for individual analysis results
type AnalysisResult = {
  fileName: string;
  size: number;
  review: string;
};

// Function to recursively read directories and process relevant files
async function analyzeDirectory(directoryPath: string): Promise<AnalysisResult[]> {
  const items = fs.readdirSync(directoryPath);
  const analysisResults: AnalysisResult[] = []; // Define the array with the type

  for (const item of items) {
    const itemPath = path.join(directoryPath, item);

    if (fs.lstatSync(itemPath).isDirectory()) {
      // Recursively analyze sub-directory
      const subDirectoryResults = await analyzeDirectory(itemPath);
      analysisResults.push(...subDirectoryResults);
    } else if (item.endsWith('.php') || item.endsWith('.module') || item.endsWith('.theme')) {
      // Read and analyze relevant files
      const content = fs.readFileSync(itemPath, 'utf-8');
      let analysisResponse;

      try {
        // Requesting a review of the code from the OpenAI API
        analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a proficient code reviewer.' },
            { role: 'user', content: `Please review the following Drupal module code:\n\n${content}` },
          ],
        });
      } catch (error) {
        console.error('OpenAI API response error:', error);
        throw new Error('Error with OpenAI API request');
      }

      const analysis: AnalysisResult = {
        fileName: itemPath,
        size: fs.statSync(itemPath).size,
        review: analysisResponse.choices[0]?.message?.content || 'No review available',
      };

      analysisResults.push(analysis);
    }
  }

  return analysisResults;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { folderPath } = req.body;

    try {
      // Check if the directory exists
      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({ error: 'Directory not found' });
      }

      // Recursively analyze the given directory
      const moduleAnalyses = await analyzeDirectory(folderPath);

      const validAnalyses = moduleAnalyses.filter(Boolean);

      // Generate a well-formatted technical documentation in markdown format
      const technicalDocumentationMarkdown = validAnalyses.map(({ fileName, size, review }) => {
        return `### File: ${path.relative(process.cwd(), fileName)}\n- **Size:** ${size} bytes\n- **Review:**\n${review}`;
      }).join('\n\n');

      // Adding a summary at the top of the document
      const summary = `# Technical Review for ${path.basename(folderPath)}\n\nThis document contains a detailed review of the Drupal module files within the specified directory.\n\n## Summary:\n- **Total Files Analyzed:** ${validAnalyses.length}\n- **Total Size:** ${validAnalyses.reduce((acc, analysis) => acc + analysis.size, 0)} bytes\n\n---\n`;

      const fullTechnicalDocument = summary + technicalDocumentationMarkdown;

      return res.status(200).send(fullTechnicalDocument);

    } catch (error) {
      console.error('Error during analysis:', error);
      return res.status(500).json({ error: 'An error occurred during analysis' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}