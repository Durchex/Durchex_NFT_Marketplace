// Performance monitoring and optimization
import Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initializePerformanceMonitoring = (config) => {
  // Initialize Sentry for error tracking
  if (config.SENTRY_DSN) {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.environment,
      tracesSampleRate: config.isProduction ? 0.1 : 1.0,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            window.history
          ),
        }),
      ],
      beforeSend(event, hint) {
        // Filter out specific errors
        if (event.exception) {
          const error = hint.originalException;
          if (error?.message?.includes('ResizeObserver')) {
            return null;
          }
        }
        return event;
      },
    });
  }

  // Google Analytics
  if (config.GA_ID && config.isProduction) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', config.GA_ID, {
      page_path: window.location.pathname,
    });
  }

  // Web Vitals monitoring
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  });
};

const sendToAnalytics = (metric) => {
  // Send Web Vitals to Sentry
  if (window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metric.name}`, 'info', {
      contexts: {
        trace: {
          op: 'web-vital',
          description: metric.name,
        },
      },
      measurements: {
        [metric.name.toLowerCase()]: { value: metric.value },
      },
    });
  }

  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

// Performance API helper
export const recordPerformanceMetrics = () => {
  if (typeof window === 'undefined') return;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const connectTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domComplete - perfData.domLoading;

  const metrics = {
    pageLoadTime,
    connectTime,
    renderTime,
    domInteractiveTime: perfData.domInteractive - perfData.navigationStart,
    resourcesTime: perfData.loadEventEnd - perfData.fetchStart,
  };

  console.log('Performance Metrics:', metrics);
  return metrics;
};

// Route-based code splitting metrics
export const trackRouteChange = (path) => {
  if (window.gtag) {
    window.gtag('config', window.GA_ID, {
      page_path: path,
    });
  }

  // Log route change
  if (window.Sentry) {
    window.Sentry.captureMessage(`Route changed to: ${path}`, 'info');
  }
};

// API call performance tracking
export const trackApiCall = (endpoint, duration, status) => {
  if (window.Sentry) {
    window.Sentry.captureMessage(`API: ${endpoint}`, 'debug', {
      contexts: {
        api: {
          endpoint,
          duration,
          status,
        },
      },
    });
  }
};

// Component render time tracking
export const withPerformanceTracking = (Component, componentName) => {
  return (props) => {
    React.useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 100) {
          console.warn(
            `Slow render detected: ${componentName} took ${renderTime}ms`
          );

          if (window.Sentry) {
            window.Sentry.captureMessage(
              `Slow render: ${componentName}`,
              'warning',
              {
                contexts: {
                  component: {
                    name: componentName,
                    renderTime,
                  },
                },
              }
            );
          }
        }
      };
    }, []);

    return <Component {...props} />;
  };
};

export default {
  initializePerformanceMonitoring,
  recordPerformanceMetrics,
  trackRouteChange,
  trackApiCall,
  withPerformanceTracking,
};
