import { WebSocket } from 'ws';
import { createModuleLogger } from '@/utils/logger';
import { redisService } from '@/services/redis';

const logger = createModuleLogger('websocket');

interface WebSocketClient extends WebSocket {
  id: string;
  subscriptions: Set<string>;
}

const clients = new Map<string, WebSocketClient>();

export const websocketHandler = (ws: WebSocket) => {
  const clientId = generateClientId();
  const client = ws as WebSocketClient;
  client.id = clientId;
  client.subscriptions = new Set();

  clients.set(clientId, client);
  logger.info(`WebSocket client connected: ${clientId}`);

  // Send welcome message
  client.send(JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: new Date().toISOString(),
  }));

  // Handle incoming messages
  client.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(client, message);
    } catch (error) {
      logger.error(`Error handling WebSocket message from ${clientId}:`, error);
      client.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
        timestamp: new Date().toISOString(),
      }));
    }
  });

  // Handle client disconnect
  client.on('close', () => {
    logger.info(`WebSocket client disconnected: ${clientId}`);
    clients.delete(clientId);
  });

  client.on('error', (error) => {
    logger.error(`WebSocket error for client ${clientId}:`, error);
  });
};

async function handleMessage(client: WebSocketClient, message: any) {
  const { type, ...payload } = message;

  switch (type) {
    case 'subscribe':
      await handleSubscribe(client, payload);
      break;

    case 'unsubscribe':
      await handleUnsubscribe(client, payload);
      break;

    case 'ping':
      client.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
      }));
      break;

    default:
      logger.warn(`Unknown message type from client ${client.id}: ${type}`);
      client.send(JSON.stringify({
        type: 'error',
        error: `Unknown message type: ${type}`,
        timestamp: new Date().toISOString(),
      }));
  }
}

async function handleSubscribe(client: WebSocketClient, payload: any) {
  const { channel } = payload;

  if (!channel) {
    client.send(JSON.stringify({
      type: 'error',
      error: 'Channel is required for subscription',
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Add to client subscriptions
  client.subscriptions.add(channel);

  // Subscribe to Redis channel if it's the first subscription
  const subscriberCount = Array.from(clients.values())
    .filter(c => c.subscriptions.has(channel)).length;

  if (subscriberCount === 1) {
    try {
      await redisService.subscribe(channel, (message) => {
        broadcastToSubscribers(channel, message);
      });
      logger.info(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      logger.error(`Failed to subscribe to Redis channel ${channel}:`, error);
    }
  }

  client.send(JSON.stringify({
    type: 'subscribed',
    channel,
    timestamp: new Date().toISOString(),
  }));

  logger.info(`Client ${client.id} subscribed to channel: ${channel}`);
}

async function handleUnsubscribe(client: WebSocketClient, payload: any) {
  const { channel } = payload;

  if (!channel) {
    client.send(JSON.stringify({
      type: 'error',
      error: 'Channel is required for unsubscription',
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Remove from client subscriptions
  client.subscriptions.delete(channel);

  client.send(JSON.stringify({
    type: 'unsubscribed',
    channel,
    timestamp: new Date().toISOString(),
  }));

  logger.info(`Client ${client.id} unsubscribed from channel: ${channel}`);
}

function broadcastToSubscribers(channel: string, message: string) {
  const subscribers = Array.from(clients.values())
    .filter(client => client.subscriptions.has(channel));

  const broadcastMessage = JSON.stringify({
    type: 'message',
    channel,
    data: JSON.parse(message),
    timestamp: new Date().toISOString(),
  });

  subscribers.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(broadcastMessage);
    }
  });

  logger.debug(`Broadcasted message to ${subscribers.length} subscribers on channel: ${channel}`);
}

// Broadcast system events
export function broadcastSystemEvent(eventType: string, data: any) {
  const message = JSON.stringify({
    type: 'system_event',
    eventType,
    data,
    timestamp: new Date().toISOString(),
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  logger.info(`Broadcasted system event: ${eventType} to ${clients.size} clients`);
}

// Utility functions
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getActiveClientCount(): number {
  return clients.size;
}

export function getClientSubscriptions(): { [clientId: string]: string[] } {
  const subscriptions: { [clientId: string]: string[] } = {};
  clients.forEach((client, clientId) => {
    subscriptions[clientId] = Array.from(client.subscriptions);
  });
  return subscriptions;
}