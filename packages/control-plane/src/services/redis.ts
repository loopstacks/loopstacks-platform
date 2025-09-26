import { createClient, RedisClientType } from 'redis';
import { createModuleLogger } from '@/utils/logger';

const logger = createModuleLogger('redis');

export class RedisService {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.client.on('disconnect', () => {
      logger.info('Disconnected from Redis');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.connected = false;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Agent coordination methods
  async announceLoop(loopId: string, loopData: any): Promise<void> {
    try {
      const key = `loop:${loopId}`;
      await this.client.set(key, JSON.stringify(loopData), { EX: 3600 }); // 1 hour TTL
      await this.client.publish('loop:announcements', JSON.stringify({ loopId, ...loopData }));
      logger.info(`Announced loop ${loopId}`);
    } catch (error) {
      logger.error(`Failed to announce loop ${loopId}:`, error);
      throw error;
    }
  }

  async submitBid(loopId: string, agentId: string, bidData: any): Promise<void> {
    try {
      const key = `loop:${loopId}:bids`;
      const bid = { agentId, timestamp: Date.now(), ...bidData };
      await this.client.hSet(key, agentId, JSON.stringify(bid));
      await this.client.expire(key, 3600); // 1 hour TTL
      logger.info(`Agent ${agentId} submitted bid for loop ${loopId}`);
    } catch (error) {
      logger.error(`Failed to submit bid for loop ${loopId}:`, error);
      throw error;
    }
  }

  async getBids(loopId: string): Promise<any[]> {
    try {
      const key = `loop:${loopId}:bids`;
      const bids = await this.client.hGetAll(key);
      return Object.entries(bids).map(([agentId, bidData]) => ({
        agentId,
        ...JSON.parse(bidData),
      }));
    } catch (error) {
      logger.error(`Failed to get bids for loop ${loopId}:`, error);
      throw error;
    }
  }

  async selectAgents(loopId: string, selectedAgentIds: string[]): Promise<void> {
    try {
      const key = `loop:${loopId}:selected`;
      await this.client.sAdd(key, selectedAgentIds);
      await this.client.expire(key, 3600); // 1 hour TTL

      // Notify selected agents
      for (const agentId of selectedAgentIds) {
        await this.client.publish(`agent:${agentId}:selected`, JSON.stringify({ loopId }));
      }

      logger.info(`Selected agents for loop ${loopId}:`, selectedAgentIds);
    } catch (error) {
      logger.error(`Failed to select agents for loop ${loopId}:`, error);
      throw error;
    }
  }

  async getSelectedAgents(loopId: string): Promise<string[]> {
    try {
      const key = `loop:${loopId}:selected`;
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error(`Failed to get selected agents for loop ${loopId}:`, error);
      throw error;
    }
  }

  async submitResult(loopId: string, agentId: string, result: any): Promise<void> {
    try {
      const key = `loop:${loopId}:results`;
      const resultData = { agentId, timestamp: Date.now(), result };
      await this.client.hSet(key, agentId, JSON.stringify(resultData));
      await this.client.expire(key, 86400); // 24 hours TTL
      logger.info(`Agent ${agentId} submitted result for loop ${loopId}`);
    } catch (error) {
      logger.error(`Failed to submit result for loop ${loopId}:`, error);
      throw error;
    }
  }

  async getResults(loopId: string): Promise<any[]> {
    try {
      const key = `loop:${loopId}:results`;
      const results = await this.client.hGetAll(key);
      return Object.entries(results).map(([agentId, resultData]) => ({
        agentId,
        ...JSON.parse(resultData),
      }));
    } catch (error) {
      logger.error(`Failed to get results for loop ${loopId}:`, error);
      throw error;
    }
  }

  // Agent registration and heartbeat
  async registerAgent(agentId: string, agentInfo: any): Promise<void> {
    try {
      const key = `agent:${agentId}`;
      const agentData = {
        ...agentInfo,
        registeredAt: Date.now(),
        lastHeartbeat: Date.now()
      };
      await this.client.set(key, JSON.stringify(agentData), { EX: 300 }); // 5 minutes TTL
      logger.info(`Registered agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to register agent ${agentId}:`, error);
      throw error;
    }
  }

  async updateHeartbeat(agentId: string): Promise<void> {
    try {
      const key = `agent:${agentId}`;
      const agentData = await this.client.get(key);
      if (agentData) {
        const parsed = JSON.parse(agentData);
        parsed.lastHeartbeat = Date.now();
        await this.client.set(key, JSON.stringify(parsed), { EX: 300 }); // 5 minutes TTL
      }
    } catch (error) {
      logger.error(`Failed to update heartbeat for agent ${agentId}:`, error);
      throw error;
    }
  }

  async getActiveAgents(): Promise<any[]> {
    try {
      const keys = await this.client.keys('agent:*');
      const agents = [];
      for (const key of keys) {
        const agentData = await this.client.get(key);
        if (agentData) {
          agents.push(JSON.parse(agentData));
        }
      }
      return agents;
    } catch (error) {
      logger.error('Failed to get active agents:', error);
      throw error;
    }
  }

  // Loop execution tracking
  async createLoopExecution(executionId: string, loopData: any): Promise<void> {
    try {
      const key = `execution:${executionId}`;
      const executionData = {
        ...loopData,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.client.set(key, JSON.stringify(executionData), { EX: 86400 }); // 24 hours TTL
      logger.info(`Created loop execution ${executionId}`);
    } catch (error) {
      logger.error(`Failed to create loop execution ${executionId}:`, error);
      throw error;
    }
  }

  async updateLoopExecution(executionId: string, updates: any): Promise<void> {
    try {
      const key = `execution:${executionId}`;
      const existingData = await this.client.get(key);
      if (existingData) {
        const parsed = JSON.parse(existingData);
        const updated = { ...parsed, ...updates, updatedAt: Date.now() };
        await this.client.set(key, JSON.stringify(updated), { EX: 86400 }); // 24 hours TTL
        logger.info(`Updated loop execution ${executionId}`);
      }
    } catch (error) {
      logger.error(`Failed to update loop execution ${executionId}:`, error);
      throw error;
    }
  }

  async getLoopExecution(executionId: string): Promise<any | null> {
    try {
      const key = `execution:${executionId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Failed to get loop execution ${executionId}:`, error);
      throw error;
    }
  }

  // Pub/Sub for real-time updates
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, callback);
      logger.info(`Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw error;
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      logger.error(`Failed to publish to channel ${channel}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const redisService = new RedisService();