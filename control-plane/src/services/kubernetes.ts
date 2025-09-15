import * as k8s from '@kubernetes/client-node';
import { createModuleLogger } from '@/utils/logger';

const logger = createModuleLogger('kubernetes');

export class KubernetesService {
  private kubeConfig: k8s.KubeConfig;
  private k8sApi: k8s.CoreV1Api;
  private customObjectsApi: k8s.CustomObjectsApi;
  private appsV1Api: k8s.AppsV1Api;
  private connected: boolean = false;

  constructor() {
    this.kubeConfig = new k8s.KubeConfig();
  }

  async connect(): Promise<void> {
    try {
      // Load kubeconfig
      if (process.env.NODE_ENV === 'development') {
        this.kubeConfig.loadFromDefault();
      } else {
        this.kubeConfig.loadFromCluster();
      }

      // Initialize APIs
      this.k8sApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
      this.customObjectsApi = this.kubeConfig.makeApiClient(k8s.CustomObjectsApi);
      this.appsV1Api = this.kubeConfig.makeApiClient(k8s.AppsV1Api);

      // Test connection
      await this.k8sApi.listNamespacedPod({ namespace: 'default' });

      this.connected = true;
      logger.info('Connected to Kubernetes cluster');
    } catch (error) {
      logger.error('Failed to connect to Kubernetes:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Disconnected from Kubernetes');
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Agent operations
  async listAgents(namespace: string = 'default'): Promise<any[]> {
    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agents'
      });
      return (response.body as any).items || [];
    } catch (error) {
      logger.error('Failed to list agents:', error);
      throw error;
    }
  }

  async getAgent(name: string, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agents',
        name
      });
      return response.body;
    } catch (error) {
      logger.error(`Failed to get agent ${name}:`, error);
      throw error;
    }
  }

  async createAgent(agent: any, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.createNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agents',
        body: agent
      });
      logger.info(`Created agent ${agent.metadata.name}`);
      return response.body;
    } catch (error) {
      logger.error('Failed to create agent:', error);
      throw error;
    }
  }

  async updateAgent(name: string, agent: any, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.replaceNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agents',
        name,
        body: agent
      });
      logger.info(`Updated agent ${name}`);
      return response.body;
    } catch (error) {
      logger.error(`Failed to update agent ${name}:`, error);
      throw error;
    }
  }

  async deleteAgent(name: string, namespace: string = 'default'): Promise<void> {
    try {
      await this.customObjectsApi.deleteNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agents',
        name
      });
      logger.info(`Deleted agent ${name}`);
    } catch (error) {
      logger.error(`Failed to delete agent ${name}:`, error);
      throw error;
    }
  }

  // AgentInstance operations
  async listAgentInstances(namespace: string = 'default'): Promise<any[]> {
    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agentinstances'
      });
      return (response.body as any).items || [];
    } catch (error) {
      logger.error('Failed to list agent instances:', error);
      throw error;
    }
  }

  async getAgentInstance(name: string, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agentinstances',
        name
      });
      return response.body;
    } catch (error) {
      logger.error(`Failed to get agent instance ${name}:`, error);
      throw error;
    }
  }

  async createAgentInstance(agentInstance: any, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.createNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agentinstances',
        body: agentInstance
      });
      logger.info(`Created agent instance ${agentInstance.metadata.name}`);
      return response.body;
    } catch (error) {
      logger.error('Failed to create agent instance:', error);
      throw error;
    }
  }

  async deleteAgentInstance(name: string, namespace: string = 'default'): Promise<void> {
    try {
      await this.customObjectsApi.deleteNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'agentinstances',
        name
      });
      logger.info(`Deleted agent instance ${name}`);
    } catch (error) {
      logger.error(`Failed to delete agent instance ${name}:`, error);
      throw error;
    }
  }

  // Realm operations
  async listRealms(namespace: string = 'default'): Promise<any[]> {
    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'realms'
      });
      return (response.body as any).items || [];
    } catch (error) {
      logger.error('Failed to list realms:', error);
      throw error;
    }
  }

  async getRealm(name: string, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'realms',
        name
      });
      return response.body;
    } catch (error) {
      logger.error(`Failed to get realm ${name}:`, error);
      throw error;
    }
  }

  // LoopStack operations
  async listLoopStacks(namespace: string = 'default'): Promise<any[]> {
    try {
      const response = await this.customObjectsApi.listNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'loopstacks'
      });
      return (response.body as any).items || [];
    } catch (error) {
      logger.error('Failed to list loopstacks:', error);
      throw error;
    }
  }

  async getLoopStack(name: string, namespace: string = 'default'): Promise<any> {
    try {
      const response = await this.customObjectsApi.getNamespacedCustomObject({
        group: 'loopstacks.io',
        version: 'v1',
        namespace,
        plural: 'loopstacks',
        name
      });
      return response.body;
    } catch (error) {
      logger.error(`Failed to get loopstack ${name}:`, error);
      throw error;
    }
  }

  // Generic Kubernetes operations
  async listNamespaces(): Promise<any[]> {
    try {
      const response = await this.k8sApi.listNamespace();
      return response.items || [];
    } catch (error) {
      logger.error('Failed to list namespaces:', error);
      throw error;
    }
  }

  async listPods(namespace: string = 'default', labelSelector?: string): Promise<any[]> {
    try {
      const response = await this.k8sApi.listNamespacedPod({
        namespace,
        labelSelector
      });
      return response.items || [];
    } catch (error) {
      logger.error('Failed to list pods:', error);
      throw error;
    }
  }
}

// Singleton instance
export const kubernetesService = new KubernetesService();