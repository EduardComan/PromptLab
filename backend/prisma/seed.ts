import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  console.log('Cleaning existing data...');
  await prisma.star.deleteMany({});
  await prisma.repoCollaborator.deleteMany({});
  await prisma.promptRun.deleteMany({});
  await prisma.mergeRequest.deleteMany({});
  await prisma.promptVersion.deleteMany({});
  await prisma.prompt.deleteMany({});
  await prisma.repository.deleteMany({});
  await prisma.orgMembership.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.image.deleteMany({});

  console.log('Creating admin user...');
  // Create admin user
  const adminUser = await prisma.account.create({
    data: {
      username: 'admin',
      email: 'admin@promptlab.com',
      password: await bcrypt.hash('admin123', 10),
      full_name: 'Admin User',
    },
  });

  console.log('Creating test user...');
  // Create test user
  const testUser = await prisma.account.create({
    data: {
      username: 'testuser',
      email: 'test@promptlab.com',
      password: await bcrypt.hash('test123', 10),
      full_name: 'Test User',
    },
  });

  console.log('Creating organization...');
  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'promptlab',
      display_name: 'PromptLab',
      description: 'Official PromptLab organization',
      owner_id: adminUser.id,
    },
  });

  console.log('Creating organization membership...');
  // Add test user to organization
  await prisma.orgMembership.create({
    data: {
      org_id: organization.id,
      user_id: testUser.id,
      role: 'MEMBER',
    },
  });

  console.log('Creating repositories...');
  // Create personal repository
  await prisma.repository.create({
    data: {
      name: 'my-prompts',
      description: 'Personal prompt collection',
      is_public: true,
      owner_user_id: testUser.id,
    },
  });

  // Create organization repository
  const orgRepo = await prisma.repository.create({
    data: {
      name: 'public-prompts',
      description: 'Public prompt collection',
      is_public: true,
      owner_org_id: organization.id,
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 