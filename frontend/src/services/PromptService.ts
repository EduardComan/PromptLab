import axios from 'axios';
import { Prompt, PromptVersion } from '../interfaces';
import api from './api'; 

class PromptService {
  // Get a single prompt by ID
  async getPrompt(promptId: string): Promise<Prompt> {
    try {
      const response = await api.get(`/prompts/${promptId}`);
      return response.data.prompt;
    } catch (error) {
      console.error('Error fetching prompt:', error);
      throw error;
    }
  }

  // Get all versions of a prompt
  async getPromptVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const response = await api.get(`/prompts/${promptId}/versions`);
      return response.data.versions || [];
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
      // The API expects a different format for the request body
      const requestBody = {
        content: data.content,
        commit_message: data.commitMessage,
        metadata_json: {
          parameters: data.parameters
        }
      };

      const response = await api.put(`/prompts/${promptId}`, requestBody);
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
      const requestBody = {
        content: data.content,
        commit_message: data.commitMessage,
        metadata_json: {
          parameters: data.parameters
        }
      };

      const response = await api.post(`/prompts/${promptId}/versions`, requestBody);
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
      const requestBody = {
        promptId,
        versionId,
        input_variables: data.input,
        model_settings: data.parameters
      };

      const response = await api.post(`/prompts/execute`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error testing prompt:', error);
      throw error;
    }
  }

  // Publish a prompt version
  async publishPromptVersion(promptId: string, versionId: string): Promise<any> {
    try {
      const response = await api.post(`/prompts/${promptId}/versions/${versionId}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing prompt version:', error);
      throw error;
    }
  }
}

export default new PromptService(); 