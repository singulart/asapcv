export interface JobAnalysis {
    jobId: string;
    userId: string;
    url: string;
    title: string;
    company: string;
    requirements: string[];
    responsibilities: string[];
    keywords: string[];
    extractedContent: string;
    createdAt: Date;
}
export interface JobRequirements {
    skills: string[];
    experience: string[];
    education: string[];
    certifications: string[];
    responsibilities: string[];
}
