import {
  PrismaClient,
  Role,
  ShipmentStatus,
  StageType,
  StageStatus,
  AlertSeverity,
  AlertStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CargoPulse database seeding...');

  // Clean existing records in referential order
  await prisma.note.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.freightStage.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Purged existing database records.');

  // Password hashing
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin1234!', saltRounds);
  const operatorPasswordHash = await bcrypt.hash('Operator1234!', saltRounds);
  const auditorPasswordHash = await bcrypt.hash('Auditor1234!', saltRounds);

  // 1. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@cargopulse.com',
      passwordHash: adminPasswordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@cargopulse.com',
      passwordHash: operatorPasswordHash,
      firstName: 'Elena',
      lastName: 'Reyes',
      role: Role.LOGISTICS_OPERATOR,
      isActive: true,
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      email: 'auditor@cargopulse.com',
      passwordHash: auditorPasswordHash,
      firstName: 'Marcus',
      lastName: 'Vance',
      role: Role.FREIGHT_AUDITOR,
      isActive: true,
    },
  });

  console.log('👤 Created seed users:');
  console.log(`   - ${adminUser.email} (${adminUser.role})`);
  console.log(`   - ${operatorUser.email} (${operatorUser.role})`);
  console.log(`   - ${auditorUser.email} (${auditorUser.role})`);

  // 2. Seed Shipment 1: Ocean Freight on Customs Hold
  const shipment1 = await prisma.shipment.create({
    data: {
      trackingNumber: 'CP-2026-X9810',
      origin: 'Shanghai Port, CN',
      destination: 'Los Angeles Gateway, US',
      currentStatus: ShipmentStatus.CUSTOMS_HOLD,
      carrierName: 'OceanBridge Global',
      eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      stages: {
        create: [
          {
            stageType: StageType.ORIGIN_HANDLING,
            stageOrder: 1,
            contractedCost: 1200.0,
            actualCost: 1200.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Export documentation and container drayage verified.',
          },
          {
            stageType: StageType.TRANSIT_1,
            stageOrder: 2,
            contractedCost: 4500.0,
            actualCost: 4850.0,
            variance: 350.0,
            variancePercent: 7.78,
            currency: 'USD',
            status: StageStatus.DISPUTED,
            auditNotes: 'Bunker adjustment factor surcharge disputed with ocean carrier.',
          },
          {
            stageType: StageType.CUSTOMS_BORDER,
            stageOrder: 3,
            contractedCost: 850.0,
            actualCost: 1250.0,
            variance: 400.0,
            variancePercent: 47.06,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Intensive exam fee applied due to random CBP inspection.',
          },
          {
            stageType: StageType.TRANSIT_2,
            stageOrder: 4,
            contractedCost: 1600.0,
            actualCost: 1600.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Rail intermodal booking confirmed.',
          },
          {
            stageType: StageType.FINAL_DESTINATION,
            stageOrder: 5,
            contractedCost: 750.0,
            actualCost: 750.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Final warehouse delivery scheduled.',
          },
        ],
      },
      alerts: {
        create: [
          {
            title: 'CBP Customs Hold - Intensive Exam Required',
            description: 'Container flagged for agricultural compliance inspection at Long Beach terminal.',
            severity: AlertSeverity.CRITICAL,
            status: AlertStatus.OPEN,
            slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            financialImpactUsd: 1450.0,
          },
          {
            title: 'Fuel Surcharge Variance Detected',
            description: 'Carrier invoiced BAF at 18% instead of contractually agreed cap of 12%.',
            severity: AlertSeverity.MEDIUM,
            status: AlertStatus.IN_PROGRESS,
            slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
            financialImpactUsd: 350.0,
          },
        ],
      },
    },
  });

  // 3-level hierarchical notes for Shipment 1
  const rootNote1 = await prisma.note.create({
    data: {
      shipmentId: shipment1.id,
      authorId: operatorUser.id,
      content: 'CBP has issued an intensive inspection hold on container MSCU7829103. Drayage driver cannot pull the box until clearance.',
      attachmentUrl: 'https://documents.cargopulse.internal/holds/CBP-7829103-notice.pdf',
    },
  });

  const level2Note1 = await prisma.note.create({
    data: {
      shipmentId: shipment1.id,
      authorId: auditorUser.id,
      parentId: rootNote1.id,
      content: 'Reviewing exam facility drayage and demurrage exposure. Negotiating with ocean carrier to pause demurrage clock during customs hold.',
    },
  });

  await prisma.note.create({
    data: {
      shipmentId: shipment1.id,
      authorId: adminUser.id,
      parentId: level2Note1.id,
      content: 'Approved carrier demurrage waiver request. Keep customs broker on escalation standby for 24h SLA compliance.',
    },
  });

  // 3. Seed Shipment 2: Transatlantic In-Transit
  const shipment2 = await prisma.shipment.create({
    data: {
      trackingNumber: 'CP-2026-E4421',
      origin: 'Rotterdam Europort, NL',
      destination: 'Chicago Logistics Hub, US',
      currentStatus: ShipmentStatus.IN_TRANSIT_FINAL,
      carrierName: 'Maersk Line',
      eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      stages: {
        create: [
          {
            stageType: StageType.ORIGIN_HANDLING,
            stageOrder: 1,
            contractedCost: 950.0,
            actualCost: 950.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Origin terminal handling fees matched contract.',
          },
          {
            stageType: StageType.TRANSIT_1,
            stageOrder: 2,
            contractedCost: 3800.0,
            actualCost: 3800.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Transatlantic ocean freight cleared.',
          },
          {
            stageType: StageType.CUSTOMS_BORDER,
            stageOrder: 3,
            contractedCost: 650.0,
            actualCost: 650.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Cleared Newark entry via automated commercial environment.',
          },
          {
            stageType: StageType.TRANSIT_2,
            stageOrder: 4,
            contractedCost: 1400.0,
            actualCost: 1520.0,
            variance: 120.0,
            variancePercent: 8.57,
            currency: 'USD',
            status: StageStatus.DISPUTED,
            auditNotes: 'Chassis split charge added without prior notification.',
          },
          {
            stageType: StageType.FINAL_DESTINATION,
            stageOrder: 5,
            contractedCost: 600.0,
            actualCost: 600.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.PENDING,
            auditNotes: 'Cross-dock delivery window booked for 14:00 CST.',
          },
        ],
      },
      alerts: {
        create: [
          {
            title: 'Unauthorized Chassis Split Fee',
            description: 'Inland drayage billed $120 split fee not outlined in master service agreement.',
            severity: AlertSeverity.LOW,
            status: AlertStatus.RESOLVED,
            slaDeadline: new Date(Date.now() - 12 * 60 * 60 * 1000),
            financialImpactUsd: 120.0,
            resolutionNotes: 'Disputed with drayage dispatcher. Credit memo issued against invoice INV-99120.',
            resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 3-level hierarchical notes for Shipment 2
  const rootNote2 = await prisma.note.create({
    data: {
      shipmentId: shipment2.id,
      authorId: operatorUser.id,
      content: 'Train manifest shows arrival in Chicago ramp tonight. Last-mile carrier alerted for morning pickup.',
    },
  });

  const level2Note2 = await prisma.note.create({
    data: {
      shipmentId: shipment2.id,
      authorId: auditorUser.id,
      parentId: rootNote2.id,
      content: 'Confirming appointment time with receiving warehouse in Bolingbrook. Ramp storage fee cutoff is tomorrow 17:00.',
    },
  });

  await prisma.note.create({
    data: {
      shipmentId: shipment2.id,
      authorId: operatorUser.id,
      parentId: level2Note2.id,
      content: 'Appointment confirmed for 09:30 AM tomorrow. Gate pass pre-registered.',
    },
  });

  // 4. Seed Shipment 3: Delivered Air Cargo with Cold Chain Audit
  const shipment3 = await prisma.shipment.create({
    data: {
      trackingNumber: 'CP-2026-A1092',
      origin: 'Incheon Intl, KR',
      destination: 'Frankfurt CargoCity, DE',
      currentStatus: ShipmentStatus.DELIVERED,
      carrierName: 'Lufthansa Cargo',
      eta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      stages: {
        create: [
          {
            stageType: StageType.ORIGIN_HANDLING,
            stageOrder: 1,
            contractedCost: 1800.0,
            actualCost: 1800.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Cold chain verification passed at ICN warehouse.',
          },
          {
            stageType: StageType.TRANSIT_1,
            stageOrder: 2,
            contractedCost: 7200.0,
            actualCost: 7100.0,
            variance: -100.0,
            variancePercent: -1.39,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Air freight under contracted volume tier rebate applied.',
          },
          {
            stageType: StageType.CUSTOMS_BORDER,
            stageOrder: 3,
            contractedCost: 500.0,
            actualCost: 500.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'EU customs entry processed under ATLAS system.',
          },
          {
            stageType: StageType.TRANSIT_2,
            stageOrder: 4,
            contractedCost: 800.0,
            actualCost: 800.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Temperature controlled dedicated truck to distribution center.',
          },
          {
            stageType: StageType.FINAL_DESTINATION,
            stageOrder: 5,
            contractedCost: 400.0,
            actualCost: 400.0,
            variance: 0.0,
            variancePercent: 0.0,
            currency: 'USD',
            status: StageStatus.APPROVED,
            auditNotes: 'Proof of Delivery signed and archived in document store.',
          },
        ],
      },
      alerts: {
        create: [
          {
            title: 'Temperature Excursion Warning',
            description: 'Sensor logged +6.2C briefly during ramp transfer; within pharmaceutical acceptable buffer (2-8C).',
            severity: AlertSeverity.HIGH,
            status: AlertStatus.RESOLVED,
            slaDeadline: new Date(Date.now() - 72 * 60 * 60 * 1000),
            financialImpactUsd: 0.0,
            resolutionNotes: 'QA released shipment after temperature data logger full audit confirmed excursion under 15 minutes.',
            resolvedAt: new Date(Date.now() - 70 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 3-level hierarchical notes for Shipment 3
  const rootNote3 = await prisma.note.create({
    data: {
      shipmentId: shipment3.id,
      authorId: operatorUser.id,
      content: 'High-value active cold chain shipment received at FRA CargoCity South.',
      attachmentUrl: 'https://documents.cargopulse.internal/qa/POD-FRA-A1092.pdf',
    },
  });

  const level2Note3 = await prisma.note.create({
    data: {
      shipmentId: shipment3.id,
      authorId: auditorUser.id,
      parentId: rootNote3.id,
      content: 'Validating air waybill charges against quarterly contracted SLA tiers.',
    },
  });

  await prisma.note.create({
    data: {
      shipmentId: shipment3.id,
      authorId: auditorUser.id,
      parentId: level2Note3.id,
      content: 'All line items approved. Cost variance showed $100 net savings. Invoice marked ready for payment.',
    },
  });

  console.log(`📦 Seeded 3 shipments with 5 stages each, alerts, and 3-level hierarchical notes.`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
