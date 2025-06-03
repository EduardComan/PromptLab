import { Prompt, PromptVersion, AvailableModel } from '../interfaces';
import api from './api';

class PromptService {
  // Get prompt by ID
  async getPrompt(promptId: string) {
    try {
      const response = await api.get(`/prompts/${promptId}`);
      return response.data.prompt;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      throw error;
    }
  }

  // Get prompt versions
  async getPromptVersions(promptId: string) {
    try {
      const response = await api.get(`/prompts/${promptId}/versions`);
      return response.data.versions;
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      throw error;
    }
  }

  // Update prompt version
  async updatePromptVersion(promptId: string, versionId: string, data: any) {
    try {
      const response = await api.put(`/prompts/${promptId}/versions/${versionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating prompt version:', error);
      throw error;
    }
  }

  // Get prompt version by ID
  async getPromptVersion(versionId: string) {
    try {
      const response = await api.get(`/prompts/versions/${versionId}`);
      return response.data.version;
    } catch (error) {
      console.error('Error fetching prompt version:', error);
      throw error;
    }
  }

  // Get prompt runs
  async getPromptRuns(promptId: string, page = 1, limit = 10) {
    try {
      const response = await api.get(`/prompts/${promptId}/runs`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching prompt runs:', error);
      throw error;
    }
  }

  // Get a specific prompt run
  async getPromptRun(runId: string) {
    try {
      const response = await api.get(`/prompts/runs/${runId}`);
      return response.data.run;
    } catch (error) {
      console.error('Error fetching prompt run:', error);
      throw error;
    }
  }

  // Get merge requests for a prompt
  async getPromptMergeRequests(promptId: string) {
    try {
      const response = await api.get(`/prompts/${promptId}/merge-requests`);
      return response.data.mergeRequests;
    } catch (error) {
      console.error('Error fetching merge requests:', error);
      throw error;
    }
  }

  // Get a specific merge request
  async getMergeRequest(mergeRequestId: string) {
    try {
      const response = await api.get(`/prompts/merge-requests/${mergeRequestId}`);
      return response.data.mergeRequest;
    } catch (error) {
      console.error('Error fetching merge request:', error);
      throw error;
    }
  }

  // Create a merge request
  async createMergeRequest(promptId: string, data: { description: string; content: string; metadata_json?: any }) {
    try {
      const response = await api.post(`/prompts/${promptId}/create-merge-request`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating merge request:', error);
      throw error;
    }
  }

  // Execute/test a prompt
  async executePrompt(promptId: string, data: { prompt: string; parameters: Record<string, string>; model: string }) {
    try {
      const response = await api.post('/prompt-execution/run', {
        promptId,
        prompt: data.prompt,
        model: data.model,
        parameters: data.parameters
      });
      return response.data;
    } catch (error) {
      console.error('Error executing prompt:', error);
      throw error;
    }
  }

  // Merge a merge request
  async mergeMergeRequest(mergeRequestId: string) {
    try {
      const response = await api.post(`/prompts/merge-requests/${mergeRequestId}/merge`);
      return response.data;
    } catch (error) {
      console.error('Error merging merge request:', error);
      throw error;
    }
  }

  // Reject a merge request
  async rejectMergeRequest(mergeRequestId: string) {
    try {
      const response = await api.post(`/prompts/merge-requests/${mergeRequestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting merge request:', error);
      throw error;
    }
  }

  // Get available models for execution
  async getAvailableModels(): Promise<AvailableModel[]> {
    try {
      const response = await api.get('/prompt-execution/models');
      return response.data.models;
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw error;
    }
  }

  // Get version metrics for prompt evolution analytics
  async getPromptVersionMetrics(promptId: string) {
    try {
      const response = await api.get(`/prompts/${promptId}/version-metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching version metrics:', error);
      throw error;
    }
  }

  // Optimize a prompt using AI-powered self-supervised optimization
  async optimizePrompt(data: {
    prompt: string;
    instructions: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) {
    try {
      const response = await api.post('/prompt-execution/optimize', data);
      return response.data;
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      throw error;
    }
  }
}

export default new PromptService(); 