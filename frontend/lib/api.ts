const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async uploadDocument(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async extractTemplate(documentId: string, title: string, fileDescription?: string) {
    return this.request("/api/extract", {
      method: "POST",
      body: JSON.stringify({
        document_id: documentId,
        title,
        file_description: fileDescription,
      }),
    })
  }

  async saveTemplate(templateData: any) {
    return this.request("/api/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    })
  }

  async listTemplates() {
    return this.request("/api/templates")
  }

  async getTemplate(templateId: string) {
    return this.request(`/api/templates/${templateId}`)
  }

  async createDraft(userQuery: string) {
    return this.request("/api/draft", {
      method: "POST",
      body: JSON.stringify({ user_query: userQuery }),
    })
  }

  async createDraftWithTemplate(templateId: string) {
    return this.request("/api/draft", {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    })
  }

  async finalizeDraft(instanceId: string, answers: Record<string, any>) {
    return this.request("/api/draft/finalize", {
      method: "POST",
      body: JSON.stringify({ instance_id: instanceId, answers }),
    })
  }

  async downloadDraftDocx(instanceId: string) {
    const url = `${this.baseUrl}/api/draft/${instanceId}/download/docx`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Failed to download DOCX")
    }

    const blob = await response.blob()
    return blob
  }

  async regenerateDraft(instanceId: string) {
    return this.request(`/api/draft/${instanceId}/regenerate`, {
      method: "POST",
    })
  }

  async editDraftVariables(instanceId: string) {
    return this.request(`/api/draft/${instanceId}/edit`, {
      method: "POST",
    })
  }

  async getTemplateAlternatives(templateId: string, userQuery: string) {
    return this.request(`/api/draft/alternatives/${templateId}?user_query=${encodeURIComponent(userQuery)}`)
  }

  async searchWeb(query: string, numResults = 3) {
    return this.request("/api/web/search", {
      method: "POST",
      body: JSON.stringify({ query, num_results: numResults }),
    })
  }

  async bootstrapFromWeb(documentId: string, documentUrl: string, title: string) {
    return this.request("/api/web/bootstrap", {
      method: "POST",
      body: JSON.stringify({ document_id: documentId, document_url: documentUrl, title }),
    })
  }

  async healthCheck() {
    return this.request("/health")
  }
}

export const apiClient = new ApiClient()
