/**
 * Common Swagger schema templates for reuse in API documentation
 */

// Repository creation schema
export const repositoryCreateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ownerType
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "My Repository"
 *               description:
 *                 type: string
 *                 example: "This is my repository description"
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               ownerType:
 *                 type: string
 *                 enum: [user, organization]
 *                 example: "user"
 *               orgId:
 *                 type: string
 *                 format: uuid
 *                 description: Required only when ownerType is 'organization'
 *                 example: "123e4567-e89b-12d3-a456-426614174000"`;

// Repository update schema
export const repositoryUpdateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Repository Name"
 *               description:
 *                 type: string
 *                 example: "Updated repository description"
 *               isPublic:
 *                 type: boolean
 *                 example: false`;

// Prompt creation schema
export const promptCreateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - repository_id
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "My Prompt"
 *               description:
 *                 type: string
 *                 example: "This is my prompt description"
 *               content:
 *                 type: string
 *                 example: "Write a poem about programming"
 *               repository_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               is_primary:
 *                 type: boolean
 *                 default: false
 *                 example: true`;

// Prompt update schema
export const promptUpdateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Prompt Title"
 *               description:
 *                 type: string
 *                 example: "Updated prompt description"
 *               content:
 *                 type: string
 *                 example: "Write a haiku about programming"
 *               is_primary:
 *                 type: boolean
 *                 example: true`;

// Organization creation schema
export const organizationCreateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - display_name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: "^[a-z0-9_-]+$"
 *                 example: "my-org"
 *               display_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "My Organization"
 *               description:
 *                 type: string
 *                 example: "This is my organization description"`;

// Organization update schema
export const organizationUpdateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Organization Name"
 *               description:
 *                 type: string
 *                 example: "Updated organization description"`;

// User registration schema
export const userRegisterSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: "^[a-zA-Z0-9_-]+$"
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "StrongP@ssw0rd"
 *               full_name:
 *                 type: string
 *                 example: "John Doe"`;

// User login schema
export const userLoginSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: "Username or email"
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongP@ssw0rd"`;

// User profile update schema
export const userProfileUpdateSchema = `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "John Smith"
 *               bio:
 *                 type: string
 *                 example: "Software developer interested in AI"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.smith@example.com"`;

/**
 * Example usage in a route file:
 * 
 * /\**
 *  * @swagger
 *  * /api/accounts/register:
 *  *   post:
 *  *     summary: Register a new user
 *  *     tags: [Accounts]
 *  * ${userRegisterSchema}
 *  * ${standardResponses.created}
 *  *     400:
 *  *       $ref: '#/components/responses/ValidationError'
 *  * ${standardResponses.serverError}
 *  *\/
 */ 