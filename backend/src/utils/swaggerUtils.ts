/**
 * Utility functions to generate Swagger documentation using a more concise syntax
 * This helps reduce verbosity in route files
 */

// Helper for pagination parameters
export const paginationParams = `
 * parameters:
 *   - $ref: '#/components/parameters/pageParam'
 *   - $ref: '#/components/parameters/limitParam'`;

// Helper for standard security
export const authSecurity = `
 * security:
 *   - bearerAuth: []`;

// Helper for standard responses
export const standardResponses = {
  ok: `
 * responses:
 *   200:
 *     $ref: '#/components/responses/SuccessResponse'`,
  
  created: `
 * responses:
 *   201:
 *     description: Resource created successfully`,
  
  notFound: `
 *   404:
 *     $ref: '#/components/responses/NotFoundError'`,
  
  serverError: `
 *   500:
 *     $ref: '#/components/responses/ServerError'`,
  
  unauthorized: `
 *   401:
 *     $ref: '#/components/responses/UnauthorizedError'`,
  
  forbidden: `
 *   403:
 *     description: Forbidden - insufficient permissions`
};

// Common response combinations
export const authResponses = `
 * responses:
 *   200:
 *     $ref: '#/components/responses/SuccessResponse'
 *   401:
 *     $ref: '#/components/responses/UnauthorizedError'
 *   500:
 *     $ref: '#/components/responses/ServerError'`;

export const crudResponses = `
 * responses:
 *   200:
 *     $ref: '#/components/responses/SuccessResponse'
 *   404:
 *     $ref: '#/components/responses/NotFoundError'
 *   500:
 *     $ref: '#/components/responses/ServerError'`;

export const authedCrudResponses = `
 * responses:
 *   200:
 *     $ref: '#/components/responses/SuccessResponse'
 *   401:
 *     $ref: '#/components/responses/UnauthorizedError'
 *   403:
 *     description: Forbidden - insufficient permissions
 *   404:
 *     $ref: '#/components/responses/NotFoundError'
 *   500:
 *     $ref: '#/components/responses/ServerError'`;

// Helper for parameter references
export const refParam = (paramName: string) => `
 * parameters:
 *   - $ref: '#/components/parameters/${paramName}'`;

// Helper for schema references
export const refSchema = (schemaName: string, required = true) => `
 * requestBody:
 *   required: ${required}
 *   content:
 *     application/json:
 *       schema:
 *         $ref: '#/components/schemas/${schemaName}'`;

/**
 * Example usage in a route file:
 * 
 * Before:
 * /\**
 *  * @swagger
 *  * /api/repositories/{id}:
 *  *   get:
 *  *     summary: Get repository by ID
 *  *     tags: [Repositories]
 *  *     parameters:
 *  *       - in: path
 *  *         name: id
 *  *         required: true
 *  *         schema:
 *  *           type: string
 *  *           format: uuid
 *  *         description: Resource ID
 *  *     responses:
 *  *       200:
 *  *         description: Repository details
 *  *       404:
 *  *         description: Repository not found
 *  *       500:
 *  *         description: Server error
 *  *\/
 * 
 * After:
 * /\**
 *  * @swagger
 *  * /api/repositories/{id}:
 *  *   get:
 *  *     summary: Get repository by ID
 *  *     tags: [Repositories]
 *  * ${refParam('idParam')}
 *  * ${crudResponses}
 *  *\/
 * router.get('/:id', repositoryController.getById);
 * 
 * // For authenticated routes with request body:
 * /\**
 *  * @swagger
 *  * /api/repositories:
 *  *   post:
 *  *     summary: Create a new repository
 *  *     tags: [Repositories]
 *  * ${authSecurity}
 *  * ${refSchema('Repository')}
 *  * ${standardResponses.created}
 *  * ${standardResponses.unauthorized}
 *  * ${standardResponses.serverError}
 *  *     400:
 *  *       $ref: '#/components/responses/ValidationError'
 *  *\/
 */ 