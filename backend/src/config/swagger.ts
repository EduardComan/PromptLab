import swaggerJsdoc from 'swagger-jsdoc';

// Reusable schema components
const components = {
  schemas: {
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        full_name: { type: 'string', nullable: true },
        bio: { type: 'string', nullable: true },
        profile_image_id: { type: 'string', format: 'uuid', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        profile_image: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', format: 'uuid' },
            mime_type: { type: 'string' }
          }
        }
      }
    },
    Repository: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        is_public: { type: 'boolean' },
        owner_user_id: { type: 'string', format: 'uuid', nullable: true },
        owner_org_id: { type: 'string', format: 'uuid', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        owner_type: { 
          type: 'string', 
          enum: ['user', 'organization'],
          description: 'Indicates whether the repository is owned by a user or an organization'
        }
      }
    },
    UserRepository: {
      allOf: [
        { $ref: '#/components/schemas/Repository' },
        { 
          type: 'object',
          properties: {
            owner_user: {
              $ref: '#/components/schemas/User'
            }
          },
          required: ['owner_user']
        }
      ]
    },
    OrganizationRepository: {
      allOf: [
        { $ref: '#/components/schemas/Repository' },
        { 
          type: 'object',
          properties: {
            owner_org: {
              $ref: '#/components/schemas/Organization'
            }
          },
          required: ['owner_org']
        }
      ]
    },
    RepositoryOwner: {
      oneOf: [
        { $ref: '#/components/schemas/User' },
        { $ref: '#/components/schemas/Organization' }
      ],
      discriminator: {
        propertyName: 'owner_type',
        mapping: {
          user: '#/components/schemas/User',
          organization: '#/components/schemas/Organization'
        }
      }
    },
    RepositoryDetail: {
      allOf: [
        { $ref: '#/components/schemas/Repository' },
        {
          type: 'object',
          properties: {
            owner_user: {
              $ref: '#/components/schemas/User'
            },
            owner_org: {
              $ref: '#/components/schemas/Organization'
            },
            prompts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Prompt'
              }
            },
            metrics: {
              type: 'object',
              properties: {
                stars: { type: 'integer' },
                isStarred: { type: 'boolean' }
              }
            },
            primaryPrompt: {
              $ref: '#/components/schemas/Prompt'
            }
          }
        }
      ]
    },
    RepositoryList: {
      type: 'object',
      properties: {
        repositories: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/RepositoryDetail'
          }
        },
        pagination: {
          $ref: '#/components/schemas/Pagination'
        }
      }
    },
    Prompt: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        repository_id: { type: 'string', format: 'uuid' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    },
    Organization: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        display_name: { type: 'string' },
        description: { type: 'string', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    },
    Error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        error: { type: 'string', nullable: true }
      }
    },
    Pagination: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
        pages: { type: 'integer' }
      }
    }
  },
  responses: {
    SuccessResponse: {
      description: 'Operation successful',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    },
    UnauthorizedError: {
      description: 'Unauthorized access',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          }
        }
      }
    },
    NotFoundError: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          }
        }
      }
    },
    ServerError: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          }
        }
      }
    },
    ValidationError: {
      description: 'Validation errors',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              errors: { 
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    RepositoryResponse: {
      description: 'Repository details',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/RepositoryDetail'
          }
        }
      }
    },
    RepositoryListResponse: {
      description: 'List of repositories',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/RepositoryList'
          }
        }
      }
    }
  },
  parameters: {
    Pagination: {
      in: 'query',
      name: 'page',
      schema: {
        type: 'integer',
        default: 1
      },
      description: 'Page number'
    },
    Limit: {
      in: 'query',
      name: 'limit',
      schema: {
        type: 'integer',
        default: 10
      },
      description: 'Number of items per page'
    },
    limitParam: {
      in: 'query',
      name: 'limit',
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      description: 'Number of items per page'
    },
    pageParam: {
      in: 'query',
      name: 'page',
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1
      },
      description: 'Page number'
    },
    usernameParam: {
      in: 'path',
      name: 'username',
      required: true,
      schema: {
        type: 'string'
      },
      description: 'Username'
    },
    orgNameParam: {
      in: 'path',
      name: 'orgName',
      required: true,
      schema: {
        type: 'string'
      },
      description: 'Organization name'
    },
    idParam: {
      in: 'path',
      name: 'id',
      required: true,
      schema: {
        type: 'string',
        format: 'uuid'
      },
      description: 'Resource ID'
    },
    ownerTypeParam: {
      in: 'query',
      name: 'ownerType',
      schema: {
        type: 'string',
        enum: ['user', 'organization']
      },
      description: 'Filter repositories by owner type'
    },
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PromptLab API',
      version: '1.0.0',
      description: 'API documentation for PromptLab application',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components,
    tags: [
      { name: 'Accounts', description: 'User accounts and authentication operations' },
      { name: 'Repositories', description: 'Repository management' },
      { name: 'UserRepositories', description: 'User-owned repository operations' },
      { name: 'OrganizationRepositories', description: 'Organization-owned repository operations' },
      { name: 'Prompts', description: 'Prompt management' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Analytics', description: 'Analytics and reporting' }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to API routes and separate docs
};

export const swaggerSpec = swaggerJsdoc(options); 