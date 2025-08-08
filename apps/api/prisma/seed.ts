import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@minicrm.local' },
    update: {},
    create: {
      email: 'admin@minicrm.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@minicrm.local' },
    update: {},
    create: {
      email: 'member@minicrm.local',
      passwordHash: memberPassword,
      role: 'MEMBER',
    },
  });

  console.log('Created users:', { adminUser, memberUser });

  // Create companies
  const companies = [];
  for (let i = 1; i <= 5; i++) {
    const company = await prisma.company.create({
      data: {
        name: `Company ${i}`,
        domain: `company${i}.com`,
        notes: `This is a sample company ${i} for testing purposes.`,
      },
    });
    companies.push(company);
  }

  console.log(`Created ${companies.length} companies`);

  // Create leads
  const leads = [];
  const sources = ['WEB', 'REFERRAL', 'EVENT', 'OTHER'];
  const statuses = ['NEW', 'QUALIFIED', 'LOST'];

  for (let i = 1; i <= 50; i++) {
    const lead = await prisma.lead.create({
      data: {
        companyId: companies[Math.floor(Math.random() * companies.length)].id,
        contactName: `Contact Person ${i}`,
        email: `contact${i}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 9000 + 1000))}`,
        source: sources[Math.floor(Math.random() * sources.length)] as any,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        score: Math.floor(Math.random() * 100),
      },
    });
    leads.push(lead);
  }

  console.log(`Created ${leads.length} leads`);

  // Create deals
  const deals = [];
  const stages = ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  for (let i = 1; i <= 30; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 90));
    
    const deal = await prisma.deal.create({
      data: {
        leadId: leads[Math.floor(Math.random() * leads.length)].id,
        title: `Deal ${i} - ${['Software License', 'Consulting', 'Support Contract', 'Implementation'][Math.floor(Math.random() * 4)]}`,
        amount: Math.floor(Math.random() * 100000) + 5000,
        stage: stages[Math.floor(Math.random() * stages.length)] as any,
        expectedCloseDate: Math.random() > 0.3 ? futureDate : null,
      },
    });
    deals.push(deal);
  }

  console.log(`Created ${deals.length} deals`);

  // Create activities
  const activities = [];
  const activityTypes = ['NOTE', 'TASK', 'CALL', 'EMAIL'];

  for (let i = 1; i <= 100; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 15);
    
    const activity = await prisma.activity.create({
      data: {
        leadId: leads[Math.floor(Math.random() * leads.length)].id,
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)] as any,
        content: `Activity ${i}: ${['Follow up with client', 'Send proposal', 'Schedule meeting', 'Review contract', 'Call to discuss requirements'][Math.floor(Math.random() * 5)]}`,
        dueDate: Math.random() > 0.3 ? dueDate : null,
        completed: Math.random() > 0.7,
      },
    });
    activities.push(activity);
  }

  console.log(`Created ${activities.length} activities`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });