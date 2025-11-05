// src/config/scoringConfig.ts

import { DomainConfig, QuestionMetadata } from "../../types/scoring";


// A. Question Weights and Inversion Logic
export const QUESTION_WEIGHTS: Record<string, QuestionMetadata> = {
    // Format: 'Q#': { weight: Diagnostic Weight (%), is_inverted: Boolean }
    'Q1': { weight: 2, is_inverted: false }, 'Q2': { weight: 4, is_inverted: true }, 
    'Q3': { weight: 3, is_inverted: false }, 'Q4': { weight: 3, is_inverted: false }, 
    'Q5': { weight: 3, is_inverted: false }, 'Q6': { weight: 4, is_inverted: false },
    'Q7': { weight: 5, is_inverted: true }, 'Q8': { weight: 3, is_inverted: false }, 
    'Q9': { weight: 4, is_inverted: false }, 'Q10': { weight: 3, is_inverted: false },
    'Q11': { weight: 2, is_inverted: false }, 'Q12': { weight: 3, is_inverted: false },
    'Q13': { weight: 4, is_inverted: false }, 'Q14': { weight: 4, is_inverted: false }, 
    'Q15': { weight: 5, is_inverted: false }, 'Q16': { weight: 4, is_inverted: false },
    'Q17': { weight: 4, is_inverted: false }, 'Q18': { weight: 5, is_inverted: false },
    'Q19': { weight: 5, is_inverted: false }, 'Q20': { weight: 15, is_inverted: true }, 
    'Q21': { weight: 15, is_inverted: true }, 'Q22': { weight: 5, is_inverted: true }, 
    'Q23': { weight: 5, is_inverted: true }, 'Q24': { weight: 5, is_inverted: true },
    'Q25': { weight: 5, is_inverted: false }, 'Q26': { weight: 10, is_inverted: true }, 
    'Q27': { weight: 10, is_inverted: true }, 'Q28': { weight: 10, is_inverted: true }, 
    'Q29': { weight: 5, is_inverted: true }, 'Q30': { weight: 5, is_inverted: true },
    'Q31': { weight: 5, is_inverted: true }, 'Q32': { weight: 5, is_inverted: true }, 
    'Q33': { weight: 3, is_inverted: false },
};

// B. Domain Configuration and Max Possible Scores (MPS)
export const DOMAIN_CONFIG: DomainConfig[] = [
    // MPS = Total Weight * 4 (as per doc)
    { name: 'Clinical Risk Index', total_weight: 45, max_possible_score: 45 * 4, questions: ['Q20', 'Q21', 'Q22', 'Q23', 'Q24', 'Q26', 'Q27', 'Q28', 'Q29'] },
    { name: 'Psychological Safety Index', total_weight: 30, max_possible_score: 30 * 4, questions: ['Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q32', 'Q33'] },
    { name: 'Workload & Efficiency', total_weight: 12, max_possible_score: 12 * 4, questions: ['Q5', 'Q6', 'Q7', 'Q31'] },
    { name: 'Leadership & Alignment', total_weight: 9, max_possible_score: 9 * 4, questions: ['Q9', 'Q16', 'Q17', 'Q31'] },
    { name: 'Satisfaction & Engagement', total_weight: 15, max_possible_score: 15 * 4, questions: ['Q1', 'Q3', 'Q4', 'Q8', 'Q10', 'Q11', 'Q12', 'Q25', 'Q30'] },
];

/** Utility function to quickly get the max score for a domain by name */
export const getDomainMaxScore = (domainName: string): number => {
    return DOMAIN_CONFIG.find(d => d.name === domainName)?.max_possible_score || 0;
}