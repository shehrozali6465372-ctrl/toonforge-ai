import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { createProject } from './factories';
import { MotionStudioDB } from './db';

describe('MotionStudioDB schema migration', () => {
  it('upgrades a populated version-1 database additively without changing existing projects', async () => {
    const databaseName = 'MotionStudioDB-migration-test';
    await Dexie.delete(databaseName);

    const original = createProject('Legacy project', '3d', '16:9');
    const legacy = new Dexie(databaseName);
    legacy.version(1).stores({ projects: 'id, name, mode, updatedAt, createdAt' });
    await legacy.open();
    await legacy.table('projects').put(original);
    await legacy.close();

    const upgraded = new MotionStudioDB(databaseName);
    try {
      await upgraded.open();
      expect(upgraded.verno).toBe(2);
      expect(await upgraded.projects.get(original.id)).toEqual(original);
      expect(await upgraded.projectMetadata.count()).toBe(0);
      expect(upgraded.tables.map((table) => table.name)).toContain('projectMetadata');
    } finally {
      upgraded.close();
      await Dexie.delete(databaseName);
    }
  });
});
