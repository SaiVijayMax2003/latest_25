export const metricsConfig = {
    endpoint: '/metrics',
    routeMetrics: {
        routeBlacklist: ['/documentation', '/metrics']
    },
    defaultMetrics: {
        enabled: true,
        prefix: 'app_'
    }
}; 