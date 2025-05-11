import axios from 'axios';
import { Prompt, PromptVersion } from '../interfaces';

class PromptService {
  // Get a single prompt by ID
  async getPrompt(promptId: string): Promise<Prompt> {
    try {
      const response = await axios.get(`/api/prompts/${promptId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      throw error;
    }
  }

  // Get all versions of a prompt
  async getPromptVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const response = await axios.get(`/api/prompts/${promptId}/versions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prompt versions:', error);
      throw error;
    }
  }

  // Update a prompt version
  async updatePromptVersion(
    promptId: string, 
    versionId: string, 
    data: { 
      content: string;
      commitMessage: string;
      parameters: any;
    }
  ): Promise<PromptVersion> {
    try {
      const response = await axios.put(`/api/prompts/${promptId}/versions/${versionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating prompt version:', error);
      throw error;
    }
  }

  // Create a new version of a prompt
  async createPromptVersion(
    promptId: string, 
    data: { 
      content: string;
      commitMessage: string;
      parameters: any;
    }
  ): Promise<PromptVersion> {
    try {
      const response = await axios.post(`/api/prompts/${promptId}/versions`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating new prompt version:', error);
      throw error;
    }
  }

  // Test a prompt with given input
  async testPrompt(
    promptId: string,
    versionId: string,
    data: {
      input: Record<string, string>;
      parameters: any;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(`/api/prompts/${promptId}/versions/${versionId}/test`, data);
      return response.data;
    } catch (error) {
      console.error('Error testing prompt:', error);
      throw error;
    }
  }

  // Publish a prompt version
  async publishPromptVersion(promptId: string, versionId: string): Promise<any> {
    try {
      const response = await axios.post(`/api/prompts/${promptId}/versions/${versionId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing prompt version:', error);
      throw error;
    }
  }
}

export default new PromptService(); 