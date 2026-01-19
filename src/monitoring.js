// Monitoring and logging setup for AWS deployment
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const AWS = require('aws-sdk');

// Configure CloudWatch
const cloudwatch = new AWS.CloudWatch();
const logs = new AWS.CloudWatchLogs();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'durchex-backend',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  }
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// File transport with daily rotation
if (process.env.NODE_ENV === 'production') {
  logger.add(new DailyRotateFile({
    filename: '/var/log/durchex/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: winston.format.json()
  }));

  // Error log
  logger.add(new DailyRotateFile({
    filename: '/var/log/durchex/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: winston.format.json()
  }));
}

// CloudWatch integration for production
class CloudWatchTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.logGroupName = opts.logGroupName || '/durchex/backend';
    this.logStreamName = opts.logStreamName || `stream-${Date.now()}`;
    this.sequenceToken = null;
  }

  async log(info, callback) {
    try {
      // Ensure log stream exists
      await logs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }).promise().catch(() => {}); // Ignore if stream exists

      const params = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [
          {
            timestamp: Date.now(),
            message: JSON.stringify(info)
          }
        ]
      };

      if (this.sequenceToken) {
        params.sequenceToken = this.sequenceToken;
      }

      const response = await logs.putLogEvents(params).promise();
      this.sequenceToken = response.nextSequenceToken;

      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }
}

if (process.env.NODE_ENV === 'production' && process.env.AWS_REGION) {
  logger.add(new CloudWatchTransport({
    logGroupName: '/ecs/durchex-backend',
    logStreamName: `instance-${process.env.ECS_TASK_ID || Date.now()}`
  }));
}

// Custom metrics
const metrics = {
  recordRequestMetric: (method, path, statusCode, duration) => {
    cloudwatch.putMetricData({
      Namespace: 'Durchex/Backend',
      MetricData: [
        {
          MetricName: 'RequestDuration',
          Value: duration,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Method', Value: method },
            { Name: 'Path', Value: path },
            { Name: 'StatusCode', Value: String(statusCode) }
          ]
        }
      ]
    }, (err) => {
      if (err) logger.error('Failed to record metric:', err);
    });
  },

  recordDatabaseMetric: (operation, duration, success) => {
    cloudwatch.putMetricData({
      Namespace: 'Durchex/Database',
      MetricData: [
        {
          MetricName: 'OperationDuration',
          Value: duration,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Operation', Value: operation },
            { Name: 'Success', Value: success ? 'true' : 'false' }
          ]
        }
      ]
    }, (err) => {
      if (err) logger.error('Failed to record DB metric:', err);
    });
  },

  recordBlockchainMetric: (event, duration) => {
    cloudwatch.putMetricData({
      Namespace: 'Durchex/Blockchain',
      MetricData: [
        {
          MetricName: 'EventProcessingDuration',
          Value: duration,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'EventType', Value: event }
          ]
        }
      ]
    }, (err) => {
      if (err) logger.error('Failed to record blockchain metric:', err);
    });
  },

  recordError: (errorType, severity) => {
    cloudwatch.putMetricData({
      Namespace: 'Durchex/Errors',
      MetricData: [
        {
          MetricName: 'ErrorCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ErrorType', Value: errorType },
            { Name: 'Severity', Value: severity }
          ]
        }
      ]
    }, (err) => {
      if (err) logger.error('Failed to record error metric:', err);
    });
  }
};

module.exports = { logger, metrics };
