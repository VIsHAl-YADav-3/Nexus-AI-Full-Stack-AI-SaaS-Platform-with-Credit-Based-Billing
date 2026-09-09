/**
 * Seeds the database with default AI Personas and prompt Templates.
 * Run with: npm run seed  (from the backend directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Persona = require('../models/Persona');
const Template = require('../models/Template');
const logger = require('./logger');

const personas = [
  {
    name: 'Code Architect',
    description: 'A senior engineer who writes clean, production-ready code and explains trade-offs.',
    systemPrompt:
      'You are a Principal Software Engineer. Provide clean, efficient, well-documented code. Explain your architectural decisions and call out trade-offs and edge cases.',
    icon: 'Code2',
    category: 'Development',
  },
  {
    name: 'Content Writer',
    description: 'A versatile copywriter for blogs, marketing copy, and social posts.',
    systemPrompt:
      'You are an expert content writer and copywriter. Write engaging, clear, and persuasive content tailored to the requested tone and audience.',
    icon: 'PenLine',
    category: 'Writing',
  },
  {
    name: 'Career Coach',
    description: 'A supportive coach for resumes, interview prep, and career strategy.',
    systemPrompt:
      'You are an experienced career coach. Give practical, encouraging, and specific advice on resumes, interviews, negotiation, and career growth.',
    icon: 'Briefcase',
    category: 'Career',
  },
  {
    name: 'Data Analyst',
    description: 'Explains data, statistics, and trends in plain language.',
    systemPrompt:
      'You are a meticulous data analyst. Explain data, statistics, and trends clearly, and suggest appropriate visualizations or further analysis.',
    icon: 'BarChart3',
    category: 'Analytics',
  },
  {
    name: 'Marketing Strategist',
    description: 'Builds go-to-market plans, campaign ideas, and growth loops.',
    systemPrompt:
      'You are a growth marketing strategist. Provide actionable marketing strategies, campaign ideas, and measurable growth tactics.',
    icon: 'Megaphone',
    category: 'Marketing',
  },
  {
    name: 'Legal Explainer',
    description: 'Breaks down legal concepts and documents in plain English.',
    systemPrompt:
      'You are a legal explainer. Break down legal concepts and documents into plain, easy-to-understand language. Always remind the user this is not formal legal advice.',
    icon: 'Scale',
    category: 'Legal',
  },
];

const templates = [
  {
    title: 'Blog Post Outline',
    category: 'Writing',
    description: 'Generate a structured outline for a blog post on any topic.',
    promptText: 'Create a detailed blog post outline about: [TOPIC]. Include an introduction, 4-5 main sections with subpoints, and a conclusion.',
    icon: 'FileText',
  },
  {
    title: 'Cold Outreach Email',
    category: 'Marketing',
    description: 'Draft a concise, persuasive cold outreach email.',
    promptText: 'Write a short, persuasive cold outreach email to [RECIPIENT] about [PRODUCT/SERVICE]. Keep it under 150 words.',
    icon: 'Mail',
  },
  {
    title: 'Bug Fix Assistant',
    category: 'Development',
    description: 'Get help diagnosing and fixing a code bug.',
    promptText: 'Here is a code snippet with a bug: [PASTE CODE]. Explain what is wrong and provide a corrected version.',
    icon: 'Bug',
  },
  {
    title: 'Resume Bullet Points',
    category: 'Career',
    description: 'Turn job responsibilities into impactful resume bullet points.',
    promptText: 'Turn these job responsibilities into 4-5 strong, quantified resume bullet points: [RESPONSIBILITIES]',
    icon: 'FileCheck',
  },
  {
    title: 'SQL Query Generator',
    category: 'Analytics',
    description: 'Generate a SQL query from a plain-English description.',
    promptText: 'Write a SQL query that: [DESCRIBE WHAT YOU WANT]. Assume the following schema: [SCHEMA]',
    icon: 'Database',
  },
  {
    title: 'Product Description',
    category: 'Marketing',
    description: 'Write a compelling e-commerce product description.',
    promptText: 'Write a compelling, SEO-friendly product description for: [PRODUCT NAME AND KEY FEATURES]',
    icon: 'ShoppingBag',
  },
  {
    title: 'Meeting Notes Summary',
    category: 'Productivity',
    description: 'Summarize raw meeting notes into clear action items.',
    promptText: 'Summarize these raw meeting notes into a clear summary with key decisions and action items: [PASTE NOTES]',
    icon: 'ClipboardList',
  },
  {
    title: 'Interview Prep Questions',
    category: 'Career',
    description: 'Generate likely interview questions for a target role.',
    promptText: 'Generate 10 likely interview questions (with brief guidance on how to answer) for a [ROLE] position at a [COMPANY TYPE] company.',
    icon: 'MessageSquare',
  },
  {
    title: 'Code Refactor',
    category: 'Development',
    description: 'Refactor code for readability and performance.',
    promptText: 'Refactor the following code for better readability and performance, explaining each change: [PASTE CODE]',
    icon: 'RefreshCw',
  },
  {
    title: 'Contract Clause Explainer',
    category: 'Legal',
    description: 'Explain a legal clause in plain English.',
    promptText: 'Explain the following contract clause in plain English and flag any potential risks: [PASTE CLAUSE]',
    icon: 'Scale',
  },
  {
    title: 'Social Media Caption Pack',
    category: 'Marketing',
    description: 'Generate a set of social captions for a single post idea.',
    promptText: 'Write 3 social media caption variations (playful, professional, and bold) for a post about: [TOPIC]',
    icon: 'Hash',
  },
];

const importData = async () => {
  try {
    await connectDB();

    await Persona.deleteMany();
    await Template.deleteMany();

    await Persona.insertMany(personas);
    await Template.insertMany(templates);

    logger.info(`Seeded ${personas.length} personas and ${templates.length} templates`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seeder error: ${error.message}`);
    process.exit(1);
  }
};

importData();
