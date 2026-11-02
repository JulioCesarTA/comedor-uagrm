import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventBusPort } from '../../use-cases/ports';

@Injectable()
export class SnsBus extends EventBusPort {
  private readonly log = new Logger('SnsBus');
  private readonly sns: SNSClient;
  private readonly region = process.env.AWS_REGION || 'us-east-1';
  private readonly endpoint = process.env.AWS_ENDPOINT_URL;

  constructor() {
    super();
    this.sns = new SNSClient({
      region: this.region,
      endpoint: this.endpoint || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });
  }

  async publish(topic: string, payload: any): Promise<void> {
    const topicArn = `arn:aws:sns:${this.region}:000000000000:${topic}`;
    try {
      await this.sns.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(payload),
      }));
      this.log.log(`publicado ${payload.type} -> ${topic}`);
    } catch (e: any) {
      this.log.error(`fallo publicando a ${topic}: ${e.message}`);
    }
  }
}
