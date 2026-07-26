import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ELASTICSEARCH_TIMEOUT_MS } from '../health.constants';

@Injectable()
export class ElasticsearchHealthIndicator extends HealthIndicator {
  async check(key: string): Promise<HealthIndicatorResult> {
    const esNode = process.env.ELASTICSEARCH_NODE;

    if (!esNode || esNode === 'http://localhost:9200') {
      return this.getStatus(key, true, {
        message: 'Elasticsearch not configured, skipping',
        configured: false,
      });
    }

    try {
      const { default: axios } = await import('axios');
      const start = Date.now();
      const response = await axios.get(`${esNode}/_cluster/health`, {
        timeout: ELASTICSEARCH_TIMEOUT_MS,
        headers: this.getAuthHeaders(),
      });
      const latencyMs = Date.now() - start;
      const data = response.data;

      const healthy = data.status !== 'red';

      if (healthy) {
        return this.getStatus(key, true, {
          status: data.status,
          nodeCount: data.number_of_nodes,
          activeShards: data.active_shards,
          latencyMs,
        });
      }

      throw new HealthCheckError(
        'Elasticsearch cluster status is red',
        this.getStatus(key, false, {
          status: data.status,
          nodeCount: data.number_of_nodes,
          activeShards: data.active_shards,
          latencyMs,
        }),
      );
    } catch (error: any) {
      if (error instanceof HealthCheckError) throw error;
      throw new HealthCheckError(
        'Elasticsearch health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const apiKey = process.env.ELASTICSEARCH_API_KEY;
    if (apiKey) {
      return { Authorization: `ApiKey ${apiKey}` };
    }
    return {};
  }
}
