import api from './api';

export interface OptimizationResponse {
  status: string;
  optimization: string;
  original_prompt: string;
  model: string;
  metrics: {
    processing_time_ms: number;
    tokens_input: number;
    tokens_output: number;
    total_tokens: number;
  };
  log: Array<{
    type: string;
    message: string;
  }>;
}

export interface OptimizationRequest {
  prompt: string;
  target?: string;
  model?: string;
}

class PromptOptimizationService {
  /**
   * Optimizes a prompt using one of the lightweight models
   * 
   * @param data The optimization request data
   * @returns The optimization response
   */
  async optimizePrompt(data: OptimizationRequest): Promise<OptimizationResponse> {
    try {
      const response = await api.post('/promptlab/optimize-prompt', data);
      return response.data;
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      throw error;
    }
  }

  /**
   * Get available optimization models
   * 
   * @returns Array of available models for optimization
   */
  async getOptimizationModels(): Promise<Array<{ id: string; name: string; size_category: string }>> {
    try {
      const response = await api.get('/promptlab/models');
      
      // Filter for smaller models suitable for prompt optimization
      const models = response.data.models.filter((model: any) => 
        model.size_category === 'small' || 
        model.id === 'orca-mini' || 
        model.id === 'phi-3-mini'
      );
      
      return models;
    } catch (error) {
      console.error('Error fetching optimization models:', error);
      return [];
    }
  }
}

export default new PromptOptimizationService(); 