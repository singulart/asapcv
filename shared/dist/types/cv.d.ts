export interface CV {
    cvId: string;
    userId: string;
    title: string;
    isBase: boolean;
    jobUrl?: string;
    content: CVContent;
    s3Key: string;
    createdAt: Date;
    modifiedSections: string[];
}
export interface CVContent {
    summary: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: string[];
    contact: ContactInfo;
}
export interface ExperienceItem {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string[];
    location?: string;
}
export interface EducationItem {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    location?: string;
}
export interface ContactInfo {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    website?: string;
}
