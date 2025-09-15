import { logger } from '@/utils/logger';

export interface MockAgent {
  id: string;
  name: string;
  namespace: string;
  status: 'active' | 'inactive' | 'error';
  instances: number;
  version: string;
  createdAt: string;
  lastSeen: string;
}

export interface MockLoopStack {
  id: string;
  name: string;
  namespace: string;
  status: 'running' | 'stopped' | 'error';
  agents: string[];
  createdAt: string;
  lastExecuted: string;
}

export interface MockRealm {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

class MockService {
  private agents: Map<string, MockAgent> = new Map();
  private loopstacks: Map<string, MockLoopStack> = new Map();
  private realms: Map<string, MockRealm> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';

    if (this.isEnabled) {
      this.initializeMockData();
      logger.info('Mock service initialized with sample data');
    }
  }

  private initializeMockData() {
    // Sample agents
    const agents: MockAgent[] = [
      {
        id: 'agent-1',
        name: 'sentiment-analyzer',
        namespace: 'loopstacks-system',
        status: 'active',
        instances: 2,
        version: '1.0.0',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastSeen: new Date().toISOString(),
      },
      {
        id: 'agent-2',
        name: 'response-generator',
        namespace: 'loopstacks-system',
        status: 'active',
        instances: 1,
        version: '1.2.0',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        lastSeen: new Date().toISOString(),
      },
      {
        id: 'agent-3',
        name: 'intent-classifier',
        namespace: 'loopstacks-system',
        status: 'inactive',
        instances: 0,
        version: '0.9.1',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    // Sample loopstacks
    const loopstacks: MockLoopStack[] = [
      {
        id: 'loopstack-1',
        name: 'customer-service-workflow',
        namespace: 'loopstacks-system',
        status: 'running',
        agents: ['agent-1', 'agent-2'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastExecuted: new Date().toISOString(),
      },
      {
        id: 'loopstack-2',
        name: 'data-processing-pipeline',
        namespace: 'loopstacks-system',
        status: 'stopped',
        agents: ['agent-3'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        lastExecuted: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    // Sample realms
    const realms: MockRealm[] = [
      {
        id: 'realm-1',
        name: 'production',
        description: 'Production environment',
        status: 'active',
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
      },
      {
        id: 'realm-2',
        name: 'staging',
        description: 'Staging environment for testing',
        status: 'active',
        createdAt: new Date(Date.now() - 1209600000).toISOString(),
      },
    ];

    // Populate maps
    agents.forEach(agent => this.agents.set(agent.id, agent));
    loopstacks.forEach(loopstack => this.loopstacks.set(loopstack.id, loopstack));
    realms.forEach(realm => this.realms.set(realm.id, realm));
  }

  // Agent methods
  getAgents(): MockAgent[] {
    if (!this.isEnabled) return [];
    return Array.from(this.agents.values());
  }

  getAgent(id: string): MockAgent | undefined {
    if (!this.isEnabled) return undefined;
    return this.agents.get(id);
  }

  createAgent(data: Partial<MockAgent>): MockAgent {
    if (!this.isEnabled) throw new Error('Mock mode not enabled');

    const agent: MockAgent = {
      id: data.id || `agent-${Date.now()}`,
      name: data.name || 'new-agent',
      namespace: data.namespace || 'loopstacks-system',
      status: data.status || 'inactive',
      instances: data.instances || 0,
      version: data.version || '1.0.0',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    this.agents.set(agent.id, agent);
    logger.info(`Mock agent created: ${agent.name}`);
    return agent;
  }

  updateAgent(id: string, data: Partial<MockAgent>): MockAgent | undefined {
    if (!this.isEnabled) return undefined;

    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updatedAgent = { ...agent, ...data, lastSeen: new Date().toISOString() };
    this.agents.set(id, updatedAgent);
    logger.info(`Mock agent updated: ${updatedAgent.name}`);
    return updatedAgent;
  }

  deleteAgent(id: string): boolean {
    if (!this.isEnabled) return false;

    const deleted = this.agents.delete(id);
    if (deleted) {
      logger.info(`Mock agent deleted: ${id}`);
    }
    return deleted;
  }

  // LoopStack methods
  getLoopStacks(): MockLoopStack[] {
    if (!this.isEnabled) return [];
    return Array.from(this.loopstacks.values());
  }

  getLoopStack(id: string): MockLoopStack | undefined {
    if (!this.isEnabled) return undefined;
    return this.loopstacks.get(id);
  }

  createLoopStack(data: Partial<MockLoopStack>): MockLoopStack {
    if (!this.isEnabled) throw new Error('Mock mode not enabled');

    const loopstack: MockLoopStack = {
      id: data.id || `loopstack-${Date.now()}`,
      name: data.name || 'new-loopstack',
      namespace: data.namespace || 'loopstacks-system',
      status: data.status || 'stopped',
      agents: data.agents || [],
      createdAt: new Date().toISOString(),
      lastExecuted: new Date().toISOString(),
    };

    this.loopstacks.set(loopstack.id, loopstack);
    logger.info(`Mock loopstack created: ${loopstack.name}`);
    return loopstack;
  }

  updateLoopStack(id: string, data: Partial<MockLoopStack>): MockLoopStack | undefined {
    if (!this.isEnabled) return undefined;

    const loopstack = this.loopstacks.get(id);
    if (!loopstack) return undefined;

    const updatedLoopStack = { ...loopstack, ...data, lastExecuted: new Date().toISOString() };
    this.loopstacks.set(id, updatedLoopStack);
    logger.info(`Mock loopstack updated: ${updatedLoopStack.name}`);
    return updatedLoopStack;
  }

  deleteLoopStack(id: string): boolean {
    if (!this.isEnabled) return false;

    const deleted = this.loopstacks.delete(id);
    if (deleted) {
      logger.info(`Mock loopstack deleted: ${id}`);
    }
    return deleted;
  }

  // Realm methods
  getRealms(): MockRealm[] {
    if (!this.isEnabled) return [];
    return Array.from(this.realms.values());
  }

  getRealm(id: string): MockRealm | undefined {
    if (!this.isEnabled) return undefined;
    return this.realms.get(id);
  }

  createRealm(data: Partial<MockRealm>): MockRealm {
    if (!this.isEnabled) throw new Error('Mock mode not enabled');

    const realm: MockRealm = {
      id: data.id || `realm-${Date.now()}`,
      name: data.name || 'new-realm',
      description: data.description || 'New realm description',
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };

    this.realms.set(realm.id, realm);
    logger.info(`Mock realm created: ${realm.name}`);
    return realm;
  }

  updateRealm(id: string, data: Partial<MockRealm>): MockRealm | undefined {
    if (!this.isEnabled) return undefined;

    const realm = this.realms.get(id);
    if (!realm) return undefined;

    const updatedRealm = { ...realm, ...data };
    this.realms.set(id, updatedRealm);
    logger.info(`Mock realm updated: ${updatedRealm.name}`);
    return updatedRealm;
  }

  deleteRealm(id: string): boolean {
    if (!this.isEnabled) return false;

    const deleted = this.realms.delete(id);
    if (deleted) {
      logger.info(`Mock realm deleted: ${id}`);
    }
    return deleted;
  }

  // Utility methods
  isMockEnabled(): boolean {
    return this.isEnabled;
  }

  getStats() {
    if (!this.isEnabled) {
      return {
        agents: 0,
        loopstacks: 0,
        realms: 0,
        activeAgents: 0,
        runningLoopStacks: 0,
      };
    }

    const agents = this.getAgents();
    const loopstacks = this.getLoopStacks();
    const realms = this.getRealms();

    return {
      agents: agents.length,
      loopstacks: loopstacks.length,
      realms: realms.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      runningLoopStacks: loopstacks.filter(ls => ls.status === 'running').length,
    };
  }
}

export const mockService = new MockService();