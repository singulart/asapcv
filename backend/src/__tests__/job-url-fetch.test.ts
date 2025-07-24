import { WebScraperService } from '../services/webScraper';
import { ErrorCode } from 'asap-cv-shared';

// Mock fetch
jest.mock('node-fetch', () => jest.fn());
import fetch from 'node-fetch';
const { Response } = jest.requireActual('node-fetch');

describe('WebScraperService', () => {
    let webScraperService: WebScraperService;

    beforeEach(() => {
        webScraperService = new WebScraperService();
        jest.clearAllMocks();
    });

    describe('validateUrl', () => {
        it('should validate correct URLs', () => {
            const validUrls = [
                'https://example.com',
                'http://example.com/job/123',
                'https://www.linkedin.com/jobs/view/123456789'
            ];

            validUrls.forEach(url => {
                expect(() => webScraperService.validateUrl(url)).not.toThrow();
            });
        });

        it('should reject invalid URLs', () => {
            const invalidUrls = [
                'not-a-url',
                'ftp://example.com',
                'file:///etc/passwd'
            ];

            invalidUrls.forEach(url => {
                expect(() => webScraperService.validateUrl(url)).toThrow();
            });
        });
    });

    describe('sanitizeUrl', () => {
        it('should remove tracking parameters', () => {
            const url = new URL('https://example.com/job/123?utm_source=google&utm_medium=cpc&id=456');
            const sanitized = webScraperService.sanitizeUrl(url);

            expect(sanitized).toBe('https://example.com/job/123?id=456');
        });

        it('should remove fragments', () => {
            const url = new URL('https://example.com/job/123#section1');
            const sanitized = webScraperService.sanitizeUrl(url);

            expect(sanitized).toBe('https://example.com/job/123');
        });
    });

    describe('fetchHtml', () => {
        it('should fetch HTML content successfully', async () => {
            const mockHtml = '<html><body><h1>Job Title</h1><div class="job-description">Description</div></body></html>';
            (fetch as jest.Mock).mockResolvedValueOnce(
                new Response(mockHtml, {
                    status: 200,
                    headers: { 'content-type': 'text/html' }
                })
            );

            const html = await webScraperService.fetchHtml('https://example.com');
            expect(html).toBe(mockHtml);
        });

        it('should throw error for non-OK responses', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce(
                new Response('Not Found', {
                    status: 404,
                    statusText: 'Not Found'
                })
            );

            await expect(webScraperService.fetchHtml('https://example.com')).rejects.toThrow();
        });

        it('should throw error for non-HTML content', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce(
                new Response('{"error": "not html"}', {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                })
            );

            await expect(webScraperService.fetchHtml('https://example.com')).rejects.toThrow();
        });
    });

    describe('extractJobContent', () => {
        it('should extract job content from HTML', () => {
            const html = `
        <html>
          <body>
            <h1>Software Engineer</h1>
            <div class="job-description">
              <p>We are looking for a software engineer with the following skills:</p>
              <ul>
                <li>JavaScript</li>
                <li>TypeScript</li>
                <li>React</li>
              </ul>
            </div>
          </body>
        </html>
      `;

            const content = webScraperService.extractJobContent(html, 'https://example.com');
            expect(content).toContain('software engineer');
            expect(content).toContain('JavaScript');
        });

        it('should throw error for insufficient content', () => {
            const html = '<html><body><h1>Job</h1></body></html>';

            expect(() => webScraperService.extractJobContent(html, 'https://example.com')).toThrow();
        });
    });

    describe('extractJobTitle', () => {
        it('should extract job title from HTML', () => {
            const html = '<html><body><h1>Software Engineer</h1></body></html>';
            const title = webScraperService.extractJobTitle(html);
            expect(title).toBe('Software Engineer');
        });

        it('should return empty string if title not found', () => {
            const html = '<html><body><p>No title here</p></body></html>';
            const title = webScraperService.extractJobTitle(html);
            expect(title).toBe('');
        });
    });

    describe('extractCompanyName', () => {
        it('should extract company name from HTML', () => {
            const html = '<html><body><div class="company-name">Acme Inc</div></body></html>';
            const company = webScraperService.extractCompanyName(html);
            expect(company).toBe('Acme Inc');
        });

        it('should return empty string if company not found', () => {
            const html = '<html><body><p>No company here</p></body></html>';
            const company = webScraperService.extractCompanyName(html);
            expect(company).toBe('');
        });
    });

    describe('fetchJobInfo', () => {
        it('should fetch and extract job information', async () => {
            const mockHtml = `
        <html>
          <body>
            <h1>Software Engineer</h1>
            <div class="company-name">Acme Inc</div>
            <div class="job-description">
              <p>We are looking for a software engineer with the following skills:</p>
              <ul>
                <li>JavaScript</li>
                <li>TypeScript</li>
                <li>React</li>
              </ul>
              <p>This is a full-time position with competitive salary and benefits.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
          </body>
        </html>
      `;

            (fetch as jest.Mock).mockResolvedValueOnce(
                new Response(mockHtml, {
                    status: 200,
                    headers: { 'content-type': 'text/html' }
                })
            );

            const jobInfo = await webScraperService.fetchJobInfo('https://example.com/job/123');

            expect(jobInfo.title).toBe('Software Engineer');
            expect(jobInfo.company).toBe('Acme Inc');
            expect(jobInfo.content).toContain('software engineer');
            expect(jobInfo.content).toContain('JavaScript');
            expect(jobInfo.url).toBe('https://example.com/job/123');
        });

        it('should handle missing title and company', async () => {
            const mockHtml = `
        <html>
          <body>
            <div class="job-description">
              <p>We are looking for a software engineer with the following skills:</p>
              <ul>
                <li>JavaScript</li>
                <li>TypeScript</li>
                <li>React</li>
              </ul>
              <p>This is a full-time position with competitive salary and benefits.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
          </body>
        </html>
      `;

            (fetch as jest.Mock).mockResolvedValueOnce(
                new Response(mockHtml, {
                    status: 200,
                    headers: { 'content-type': 'text/html' }
                })
            );

            const jobInfo = await webScraperService.fetchJobInfo('https://example.com/job/123');

            expect(jobInfo.title).toBe('');
            expect(jobInfo.company).toBe('');
            expect(jobInfo.content).toContain('software engineer');
            expect(jobInfo.url).toBe('https://example.com/job/123');
        });
    });
});