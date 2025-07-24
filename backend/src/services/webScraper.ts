import * as cheerio from 'cheerio';
import { URL } from 'url';
import { ErrorCode, createError } from 'asap-cv-shared';

/**
 * Web scraping service for fetching job descriptions from URLs
 */
export class WebScraperService {
    /**
     * Validates a URL string
     * @param urlString URL to validate
     * @returns Validated and normalized URL
     * @throws Error if URL is invalid
     */
    public validateUrl(urlString: string): URL {
        try {
            // Try to create a URL object to validate
            const url = new URL(urlString);

            // Ensure protocol is http or https
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('URL must use HTTP or HTTPS protocol');
            }

            return url;
        } catch (error) {
            throw createError(
                ErrorCode.INVALID_URL,
                'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
                { value: urlString }
            );
        }
    }

    /**
     * Sanitizes a URL by removing tracking parameters and fragments
     * @param url URL to sanitize
     * @returns Sanitized URL string
     */
    public sanitizeUrl(url: URL): string {
        // Common tracking parameters to remove
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'ref', 'referrer', 'source', 'track'
        ];

        // Create a new URL object to avoid modifying the original
        const sanitizedUrl = new URL(url.toString());

        // Remove tracking parameters
        trackingParams.forEach(param => {
            sanitizedUrl.searchParams.delete(param);
        });

        // Remove fragment (hash)
        sanitizedUrl.hash = '';

        return sanitizedUrl.toString();
    }

    /**
     * Fetches HTML content from a URL
     * @param url URL to fetch
     * @returns HTML content as string
     * @throws Error if fetch fails
     */
    public async fetchHtml(url: string): Promise<string> {
        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ASAP-CV/1.0 (https://asapcv.argorand.io; info@argorand.io)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                signal: controller.signal
            });

            // Clear the timeout as the request completed
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw createError(
                    ErrorCode.JOB_FETCH_FAILED,
                    `Failed to fetch URL: ${response.status} ${response.statusText}`,
                    { context: { statusCode: response.status } }
                );
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
                throw createError(
                    ErrorCode.JOB_FETCH_FAILED,
                    'URL does not contain HTML content',
                    { context: { contentType } }
                );
            }

            return await response.text();
        } catch (error: any) {
            // Handle network errors
            if (error.code === ErrorCode.JOB_FETCH_FAILED) {
                throw error;
            }

            throw createError(
                ErrorCode.JOB_FETCH_FAILED,
                `Failed to fetch URL: ${error.message}`,
                { context: { originalError: error.message } }
            );
        }
    }

    /**
     * Extracts job description content from HTML
     * @param html HTML content
     * @param url Original URL (for context)
     * @returns Extracted job description text
     */
    public extractJobContent(html: string, url: string): string {
        try {
            const $ = cheerio.load(html);
    
            // Remove noisy elements
            $('script, style, nav, header, footer, iframe, noscript').remove();
    
            // Step 1: Known selectors
            const selectors = [
                '.job-description', '#job-description', '.description', '#description',
                '[data-testid="jobDescriptionText"]', '.jobDescriptionText',
                '.job-details', '#job-details', '.details', '#details',
                '.job-content', '#job-content', '.content', '#content',
                '.description__text', '.show-more-less-html',
                '#jobDescriptionText', '.jobsearch-jobDescriptionText',
                '.jobDescriptionContent', '.empDescription',
                '#JobDescription', '.job-description-container',
                '.job_description', '.jobDescriptionSection',
                'article', 'main', '.main', '#main'
            ];
    
            let content = '';
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    content = element.text().trim();
                    if (content.length > 100) break;
                }
            }
    
            // Step 2: DOM Density fallback
            if (content.length < 100) {
                const candidates: { score: number; text: string }[] = [];
    
                $('div, section, article').each((_, el) => {
                    const $el = $(el);
                    const text = $el.text().trim();
                    const tagCount = $el.find('*').length;
                    const textLength = text.length;
    
                    if (textLength < 100 || tagCount < 5) return;
    
                    const score = textLength / (tagCount + 1);
                    candidates.push({ score, text });
                });
    
                candidates.sort((a, b) => b.score - a.score);
                if (candidates.length > 0) {
                    content = candidates[0].text;
                }
            }
    
            // Step 3: JSON-LD (JobPosting schema)
            if (content.length < 100) {
                const jsonLdContent = this.extractJsonLdJobPosting(html);
                if (jsonLdContent.length > 100) {
                    content = jsonLdContent;
                }
            }
    
            // Step 4: Final fallback to <body>
            if (content.length < 100) {
                content = $('body').text().trim();
            }
    
            content = this.cleanContent(content);
    
            if (content.length < 100) {
                throw createError(
                    ErrorCode.JOB_CONTENT_INSUFFICIENT,
                    'Unable to extract sufficient job information from the provided URL',
                    { context: { contentLength: content.length, url } }
                );
            }
    
            console.log(content);
            return content;
        } catch (error: any) {
            if (error.code === ErrorCode.JOB_CONTENT_INSUFFICIENT) {
                throw error;
            }
    
            throw createError(
                ErrorCode.JOB_FETCH_FAILED,
                `Failed to extract job content: ${error.message}`,
                { context: { originalError: error.message, url } }
            );
        }
    }
    
    /**
     * Cleans up extracted content
     * @param content Raw content
     * @returns Cleaned content
     */
    private cleanContent(content: string): string {
        // Replace multiple whitespace with a single space
        let cleaned = content.replace(/\s+/g, ' ');

        // Replace multiple newlines with a single newline
        cleaned = cleaned.replace(/\n+/g, '\n');

        // Remove any non-printable characters
        cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, '');

        return cleaned.trim();
    }

    /**
     * Extracts job title from HTML
     * @param html HTML content
     * @returns Extracted job title or empty string if not found
     */
    public extractJobTitle(html: string): string {
        try {
            const $ = cheerio.load(html);

            // Try to find job title based on common selectors
            const selectors = [
                'h1', 'h1.title', 'h1.job-title', '.job-title', '#job-title',
                '[data-testid="jobTitle"]', '.jobTitle', '.job-header h1',
                'title', '.title', '#title'
            ];

            // Try each selector and use the first one that returns content
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    const title = element.first().text().trim();
                    if (title.length > 0) {
                        return title;
                    }
                }
            }

            return '';
        } catch (error) {
            return '';
        }
    }

    /**
     * Extracts job description from JSON-LD if available and structured as JobPosting
     */
    private extractJsonLdJobPosting(html: string): string {
        try {
            const $ = cheerio.load(html);
            const scripts = $('script[type="application/ld+json"]');

            for (let i = 0; i < scripts.length; i++) {
                const raw = $(scripts[i]).html();
                if (!raw) continue;

                try {
                    const json = JSON.parse(raw);

                    // Some pages have an array of JSON-LD blocks
                    const entries = Array.isArray(json) ? json : [json];

                    for (const entry of entries) {
                        if (entry['@type'] === 'JobPosting' && typeof entry.description === 'string') {
                            return cheerio.load(entry.description).text().trim(); // Strip any HTML in description
                        }
                    }
                } catch {
                    continue; // Skip malformed or unrelated JSON
                }
            }
            return '';
        } catch {
            return '';
        }
    }

    /**
     * Extracts company name from HTML
     * @param html HTML content
     * @returns Extracted company name or empty string if not found
     */
    public extractCompanyName(html: string): string {
        try {
            const $ = cheerio.load(html);
    
            // Try to find company name based on common selectors
            const selectors = [
                '.company-name', '#company-name', '[data-testid="companyName"]',
                '.companyName', '.company', '#company', '[itemprop="hiringOrganization"]',
                '.employer-name', '#employer-name', '.employer', '#employer'
            ];
    
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    const company = element.first().text().trim();
                    if (company.length > 0) {
                        return company;
                    }
                }
            }
    
            // Fallback to JSON-LD lookup
            const jsonLdCompany = this.extractJsonLdCompanyName(html);
            if (jsonLdCompany) {
                return jsonLdCompany;
            }
    
            return '';
        } catch {
            return '';
        }
    }

    /**
     * Extracts company name from JSON-LD if available and structured as JobPosting
     */
    private extractJsonLdCompanyName(html: string): string {
        try {
            const $ = cheerio.load(html);
            const scripts = $('script[type="application/ld+json"]');

            for (let i = 0; i < scripts.length; i++) {
                const raw = $(scripts[i]).html();
                if (!raw) continue;

                try {
                    const json = JSON.parse(raw);
                    const entries = Array.isArray(json) ? json : [json];

                    for (const entry of entries) {
                        if (
                            entry['@type'] === 'JobPosting' &&
                            typeof entry.hiringOrganization?.name === 'string'
                        ) {
                            return entry.hiringOrganization.name.trim();
                        }
                    }
                } catch {
                    continue;
                }
            }

            return '';
        } catch {
            return '';
        }
    }


    /**
     * Fetches and extracts job information from a URL
     * @param urlString URL to fetch
     * @returns Job information object
     */
    public async fetchJobInfo(urlString: string): Promise<{
        url: string;
        title: string;
        company: string;
        content: string;
    }> {
        // Validate URL
        const url = this.validateUrl(urlString);

        // Sanitize URL
        const sanitizedUrl = this.sanitizeUrl(url);

        // Fetch HTML content
        const html = await this.fetchHtml(sanitizedUrl);

        // Extract job information
        const title = this.extractJobTitle(html);
        const company = this.extractCompanyName(html);
        const content = this.extractJobContent(html, sanitizedUrl);

        return {
            url: sanitizedUrl,
            title,
            company,
            content
        };
    }
}