export interface KnowledgeFAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface KnowledgeFAQCategory {
  id: string;
  title: string;
  items: KnowledgeFAQItem[];
}

export interface KnowledgeFAQResponse {
  categories: KnowledgeFAQCategory[];
}
