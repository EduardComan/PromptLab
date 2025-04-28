/**
 * Common Swagger schema templates for reuse in API documentation
 * This helps reduce duplication and maintain consistency
 */

// Repository create/update request schemas
export const repositoryCreateSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *           - ownerType
 *         properties:
 *           name:
 *             type: string
 *             minLength: 2
 *             maxLength: 100
 *           description:
 *             type: string
 *           isPublic:
 *             type: boolean
 *             default: true
 *           ownerType:
 *             type: string
 *             enum: [user, organization]
 *             description: Determines whether the repository belongs to a user or an organization
 *           orgId:
 *             type: string
 *             format: uuid
 *             description: Required if ownerType is organization`;

export const userRepositoryCreateSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *             minLength: 2
 *             maxLength: 100
 *           description:
 *             type: string
 *           isPublic:
 *             type: boolean
 *             default: true`;

export const orgRepositoryCreateSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *           - orgId
 *         properties:
 *           name:
 *             type: string
 *             minLength: 2
 *             maxLength: 100
 *           description:
 *             type: string
 *           isPublic:
 *             type: boolean
 *             default: true
 *           orgId:
 *             type: string
 *             format: uuid
 *             description: ID of the organization that will own this repository`;

export const repositoryUpdateSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *             minLength: 2
 *             maxLength: 100
 *           description:
 *             type: string
 *           isPublic:
 *             type: boolean`;

// Profile update request
export const profileUpdateSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           bio:
 *             type: string
 *           email:
 *             type: string
 *             format: email
 *           full_name:
 *             type: string`;

// Password change request
export const passwordChangeSchema = `
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - currentPassword
 *           - newPassword
 *         properties:
 *           currentPassword:
 *             type: string
 *           newPassword:
 *             type: string
 *             minLength: 6`;

// Response schemas for common operations
export const paginatedListSchema = (itemType: string) => `
 * responses:
 *   200:
 *     description: Paginated list result
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             ${itemType}:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/${itemType}'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'`;

export const userRepositoryListSchema = `
 * responses:
 *   200:
 *     description: List of user-owned repositories
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             repositories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserRepository'
 *             user:
 *               $ref: '#/components/schemas/User'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'`;

export const orgRepositoryListSchema = `
 * responses:
 *   200:
 *     description: List of organization-owned repositories
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             repositories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrganizationRepository'
 *             organization:
 *               $ref: '#/components/schemas/Organization'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'`;

/**
 * Example usage in a route file:
 * 
 * /\**
 *  * @swagger
 *  * /api/repositories:
 *  *   post:
 *  *     summary: Create a new repository
 *  *     tags: [Repositories]
 *  *     security:
 *  *       - bearerAuth: []
 *  * ${repositoryCreateSchema}
 *  *     responses:
 *  *       201:
 *  *         description: Repository created successfully
 *  *       400:
 *  *         $ref: '#/components/responses/ValidationError'
 *  *       401:
 *  *         $ref: '#/components/responses/UnauthorizedError'
 *  *       500:
 *  *         $ref: '#/components/responses/ServerError'
 *  *\/
 * 
 * /\**
 *  * @swagger
 *  * /api/repositories/user/{username}:
 *  *   get:
 *  *     summary: Get repositories for a specific user
 *  *     tags: [UserRepositories]
 *  *     parameters:
 *  *       - $ref: '#/components/parameters/usernameParam'
 *  *       - $ref: '#/components/parameters/pageParam'
 *  *       - $ref: '#/components/parameters/limitParam'
 *  * ${userRepositoryListSchema}
 *  *     responses:
 *  *       404:
 *  *         $ref: '#/components/responses/NotFoundError'
 *  *       500:
 *  *         $ref: '#/components/responses/ServerError'
 *  *\/
 */ 