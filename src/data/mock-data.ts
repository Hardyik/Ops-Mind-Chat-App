import { Conversation, Document, QueryStat, DailyQueryVolume, RecentQuery, ChatMessage, Citation } from "@/types";

export const mockDocuments: Document[] = [
  { id: "1", name: "Employee Handbook 2025.pdf", uploadDate: new Date("2025-12-01"), pageCount: 142, status: "indexed", size: "4.2 MB" },
  { id: "2", name: "IT Security Policy.pdf", uploadDate: new Date("2025-12-05"), pageCount: 38, status: "indexed", size: "1.1 MB" },
  { id: "3", name: "Onboarding Guide.pdf", uploadDate: new Date("2025-12-10"), pageCount: 24, status: "indexed", size: "820 KB" },
  { id: "4", name: "Benefits & Compensation.pdf", uploadDate: new Date("2025-12-15"), pageCount: 56, status: "indexed", size: "2.3 MB" },
  { id: "5", name: "Remote Work Policy.pdf", uploadDate: new Date("2026-01-02"), pageCount: 12, status: "indexed", size: "340 KB" },
  { id: "6", name: "Q4 Financial Report.pdf", uploadDate: new Date("2026-01-20"), pageCount: 88, status: "embedding", size: "5.7 MB" },
  { id: "7", name: "Travel & Expense Policy.pdf", uploadDate: new Date("2026-02-01"), pageCount: 18, status: "chunking", size: "560 KB" },
];

export const mockQueryStats: QueryStat[] = [
  { topic: "Leave Policy", count: 245 },
  { topic: "IT Support", count: 198 },
  { topic: "Benefits", count: 176 },
  { topic: "Remote Work", count: 153 },
  { topic: "Onboarding", count: 134 },
  { topic: "Expense Claims", count: 112 },
  { topic: "Security", count: 89 },
  { topic: "Compensation", count: 67 },
];

export const mockDailyVolume: DailyQueryVolume[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    queries: Math.floor(Math.random() * 80) + 20,
  };
});

export const mockRecentQueries: RecentQuery[] = [
  { id: "q1", query: "What is the vacation policy for new employees?", user: "Sarah Chen", timestamp: new Date(Date.now() - 300000), documentsReferenced: ["Employee Handbook 2025.pdf"] },
  { id: "q2", query: "How do I set up VPN access?", user: "Mike Johnson", timestamp: new Date(Date.now() - 900000), documentsReferenced: ["IT Security Policy.pdf", "Onboarding Guide.pdf"] },
  { id: "q3", query: "What are the dental benefits?", user: "Lisa Park", timestamp: new Date(Date.now() - 1800000), documentsReferenced: ["Benefits & Compensation.pdf"] },
  { id: "q4", query: "Can I work from another country?", user: "James Wright", timestamp: new Date(Date.now() - 3600000), documentsReferenced: ["Remote Work Policy.pdf"] },
  { id: "q5", query: "What's the process for expense reimbursement?", user: "Anna Kim", timestamp: new Date(Date.now() - 7200000), documentsReferenced: ["Travel & Expense Policy.pdf"] },
];

const citations1: Citation[] = [
  { documentName: "Employee Handbook 2025.pdf", pageNumber: 34, snippet: "All full-time employees are entitled to 20 days of paid annual leave per calendar year. Leave accrues on a monthly basis at the rate of 1.67 days per month." },
  { documentName: "Employee Handbook 2025.pdf", pageNumber: 35, snippet: "New employees in their probationary period (first 6 months) accrue leave at the same rate but may only take up to 5 days during this period." },
];

const citations2: Citation[] = [
  { documentName: "Remote Work Policy.pdf", pageNumber: 3, snippet: "Employees may request to work remotely up to 3 days per week. A formal request must be submitted to the department manager and HR for approval." },
  { documentName: "Remote Work Policy.pdf", pageNumber: 5, snippet: "The company provides a one-time home office stipend of $500 for remote-eligible employees to set up their workspace." },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv1",
    title: "Vacation policy inquiry",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
    messages: [
      { id: "m1", role: "user", content: "What is the vacation policy for new employees?", timestamp: new Date(Date.now() - 86400000) },
      {
        id: "m2", role: "assistant",
        content: "Based on the Employee Handbook, all full-time employees are entitled to **20 days of paid annual leave** per calendar year. Leave accrues monthly at 1.67 days per month.\n\nFor new employees in their **probationary period** (first 6 months), leave accrues at the same rate, but you may only take up to **5 days** during this period.\n\nAfter the probation period, the full accrued leave balance becomes available.",
        citations: citations1,
        suggestedQuestions: ["How do I request time off?", "What happens to unused leave at year end?", "Is there a separate sick leave policy?"],
        timestamp: new Date(Date.now() - 86399000),
      },
    ],
  },
  {
    id: "conv2",
    title: "Remote work guidelines",
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
    messages: [
      { id: "m3", role: "user", content: "What are the remote work guidelines?", timestamp: new Date(Date.now() - 172800000) },
      {
        id: "m4", role: "assistant",
        content: "According to the Remote Work Policy, employees may request to **work remotely up to 3 days per week**. Here's what you need to know:\n\n1. **Approval**: Submit a formal request to your department manager and HR\n2. **Home Office Stipend**: The company provides a one-time **$500 stipend** for setting up your home workspace\n3. **Availability**: You must be available during core hours (10 AM – 4 PM)\n4. **Equipment**: The company provides a laptop; monitors and peripherals are covered by the stipend",
        citations: citations2,
        suggestedQuestions: ["Can I work from another country?", "How do I apply for the home office stipend?", "What are the core working hours?"],
        timestamp: new Date(Date.now() - 172799000),
      },
    ],
  },
  {
    id: "conv3",
    title: "IT security question",
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(Date.now() - 604800000),
    messages: [
      { id: "m5", role: "user", content: "How do I reset my password?", timestamp: new Date(Date.now() - 604800000) },
      {
        id: "m6", role: "assistant",
        content: "To reset your corporate password, follow these steps:\n\n1. Go to the **IT Self-Service Portal** at `https://it.infotact.internal`\n2. Click **\"Forgot Password\"**\n3. Enter your employee ID and registered email\n4. You'll receive a reset link valid for **30 minutes**\n5. Create a new password following the security requirements:\n   - Minimum 12 characters\n   - At least one uppercase, lowercase, number, and special character\n\nIf you're locked out, contact the IT Help Desk at ext. **4357**.",
        citations: [{ documentName: "IT Security Policy.pdf", pageNumber: 12, snippet: "Passwords must be changed every 90 days. The self-service portal allows employees to reset passwords independently." }],
        suggestedQuestions: ["What are the password requirements?", "How often do I need to change my password?", "How do I set up two-factor authentication?"],
        timestamp: new Date(Date.now() - 604799000),
      },
    ],
  },
];

// Mock AI responses keyed by simple keyword matching
export const mockResponses: Record<string, { content: string; citations: Citation[]; suggestedQuestions: string[] }> = {
  vacation: {
    content: "Based on the Employee Handbook, all full-time employees are entitled to **20 days of paid annual leave** per calendar year. Leave accrues monthly at 1.67 days per month.\n\nFor new employees in their **probationary period** (first 6 months), leave accrues at the same rate, but you may only take up to **5 days** during this period.",
    citations: citations1,
    suggestedQuestions: ["How do I request time off?", "What happens to unused leave at year end?", "Is there a separate sick leave policy?"],
  },
  remote: {
    content: "According to the Remote Work Policy, employees may request to **work remotely up to 3 days per week**.\n\n1. **Approval**: Submit a formal request to your department manager and HR\n2. **Home Office Stipend**: One-time **$500 stipend** for home workspace setup\n3. **Availability**: Must be available during core hours (10 AM – 4 PM)",
    citations: citations2,
    suggestedQuestions: ["Can I work from another country?", "How do I apply for the home office stipend?", "What are the core working hours?"],
  },
  benefit: {
    content: "Infotact Solutions offers a comprehensive benefits package:\n\n- **Health Insurance**: PPO and HMO options with 80% employer contribution\n- **Dental**: Full coverage for preventive care, 70% for major procedures\n- **Vision**: Annual eye exam and $200 frame allowance\n- **401(k)**: Company matches up to **4%** of salary\n- **Life Insurance**: 2x annual salary at no cost",
    citations: [{ documentName: "Benefits & Compensation.pdf", pageNumber: 8, snippet: "The company provides comprehensive health coverage including medical, dental, and vision plans with competitive employer contributions." }],
    suggestedQuestions: ["When is open enrollment?", "Can I add dependents to my plan?", "What's the 401k vesting schedule?"],
  },
  expense: {
    content: "The expense reimbursement process is straightforward:\n\n1. **Submit** receipts through the Expense Portal within **30 days**\n2. **Manager Approval**: Your direct manager reviews and approves\n3. **Finance Processing**: Takes 5-7 business days after approval\n4. **Reimbursement**: Deposited directly to your payroll account\n\n**Per Diem Rates**: Domestic travel $75/day for meals, International varies by country.",
    citations: [{ documentName: "Travel & Expense Policy.pdf", pageNumber: 6, snippet: "All business expenses must be submitted within 30 calendar days of being incurred. Receipts are required for any expense exceeding $25." }],
    suggestedQuestions: ["What's the per diem for international travel?", "Do I need pre-approval for travel?", "What expenses are not reimbursable?"],
  },
  security: {
    content: "Here are the key IT security policies:\n\n- **Passwords**: Must be changed every **90 days**, minimum 12 characters\n- **2FA**: Required for all corporate applications\n- **VPN**: Mandatory when accessing company resources remotely\n- **Phishing**: Report suspicious emails to `security@infotact.com`\n- **Data Classification**: Confidential data must be encrypted at rest and in transit",
    citations: [{ documentName: "IT Security Policy.pdf", pageNumber: 5, snippet: "All employees must complete annual security awareness training. Two-factor authentication is mandatory for accessing any corporate system." }],
    suggestedQuestions: ["How do I set up VPN?", "What qualifies as confidential data?", "When is the next security training?"],
  },
};

export function getMockResponse(query: string): { content: string; citations: Citation[]; suggestedQuestions: string[]; isGuardrail: boolean } {
  const lower = query.toLowerCase();
  for (const [keyword, response] of Object.entries(mockResponses)) {
    if (lower.includes(keyword)) {
      return { ...response, isGuardrail: false };
    }
  }
  // Check for more keywords
  if (lower.includes("leave") || lower.includes("time off") || lower.includes("holiday") || lower.includes("pto")) {
    return { ...mockResponses.vacation, isGuardrail: false };
  }
  if (lower.includes("work from home") || lower.includes("wfh") || lower.includes("hybrid")) {
    return { ...mockResponses.remote, isGuardrail: false };
  }
  if (lower.includes("insurance") || lower.includes("dental") || lower.includes("health") || lower.includes("401k")) {
    return { ...mockResponses.benefit, isGuardrail: false };
  }
  if (lower.includes("password") || lower.includes("vpn") || lower.includes("phishing")) {
    return { ...mockResponses.security, isGuardrail: false };
  }
  if (lower.includes("reimburse") || lower.includes("travel") || lower.includes("per diem")) {
    return { ...mockResponses.expense, isGuardrail: false };
  }

  // Guardrail — no matching content
  return {
    content: "I don't have enough information in the indexed documents to answer this question. Please try rephrasing your question or contact your department lead for assistance.",
    citations: [],
    suggestedQuestions: ["What is the vacation policy?", "How do I work remotely?", "What benefits does the company offer?"],
    isGuardrail: true,
  };
}
