import { eq } from 'drizzle-orm';
import { ServiceEvidence } from '../../../domain/entities';
import { ServiceEvidenceRepository } from '../../../domain/repositories';
import { drizzleDb } from '../drizzle';
import { toServiceEvidenceEntity } from '../mappers';
import { serviceEvidencesTable } from '../schema';

export class ServiceEvidenceDrizzleRepository implements ServiceEvidenceRepository {
  async create(
    data: Omit<ServiceEvidence, 'id' | 'createdAt'>,
  ): Promise<ServiceEvidence> {
    const [row] = await drizzleDb
      .insert(serviceEvidencesTable)
      .values({
        serviceId: data.serviceId,
        imageUrl: data.imageUrl,
      })
      .returning();

    return toServiceEvidenceEntity(row);
  }

  async listByServiceId(serviceId: string): Promise<ServiceEvidence[]> {
    const rows = await drizzleDb
      .select()
      .from(serviceEvidencesTable)
      .where(eq(serviceEvidencesTable.serviceId, serviceId));

    return rows.map(toServiceEvidenceEntity);
  }
}
