interface OpenApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description?: string;
  requestBody?: { required: boolean; contentType: string };
  pathParams?: Array<{ name: string; description: string }>;
  queryParams?: Array<{ name: string; type: string; required?: boolean; description: string }>;
  responses: Array<{ status: number; description: string }>;
  requiresAuth: boolean;
}

const ROUTES: OpenApiRoute[] = [
  { path: '/api/health', method: 'GET', summary: 'Health check', requiresAuth: false, responses: [{ status: 200, description: 'OK' }] },

  { path: '/api/settings/tokens', method: 'GET', summary: 'Get token status flags', requiresAuth: true, responses: [{ status: 200, description: 'Token status' }] },
  { path: '/api/settings/tokens', method: 'POST', summary: 'Save encrypted tokens', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/settings/config', method: 'GET', summary: 'Get non-secret config', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/settings/config', method: 'PATCH', summary: 'Update non-secret config', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },

  { path: '/api/hf/spaces', method: 'GET', summary: 'List HF Spaces', requiresAuth: true, responses: [{ status: 200, description: 'Spaces' }] },
  { path: '/api/hf/spaces/{id}/status', method: 'GET', summary: 'Get space status', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], responses: [{ status: 200, description: 'Status' }] },
  { path: '/api/hf/spaces/{id}/restart', method: 'POST', summary: 'Restart space', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/stop', method: 'POST', summary: 'Stop space', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/sleep', method: 'POST', summary: 'Sleep space', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/logs', method: 'GET', summary: 'Space logs', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], responses: [{ status: 200, description: 'Logs' }] },
  { path: '/api/hf/spaces/{id}/files', method: 'GET', summary: 'List space files', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }], queryParams: [{ name: 'path', type: 'string', description: 'subpath' }], responses: [{ status: 200, description: 'Files' }] },
  { path: '/api/hf/spaces/{id}/file/{path}', method: 'GET', summary: 'Read file', requiresAuth: true, pathParams: [{ name: 'id', description: 'space id' }, { name: 'path', description: 'file path' }], responses: [{ status: 200, description: 'Content' }] },
  { path: '/api/hf/spaces/{id}/file/{path}', method: 'PUT', summary: 'Write file', requiresAuth: true, requestBody: { required: true, contentType: 'text/plain' }, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/file/{path}', method: 'DELETE', summary: 'Delete file', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/patch-wss', method: 'POST', summary: 'Patch WSS agent', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/hf/spaces/{id}/terminal-ws', method: 'GET', summary: 'Get WSS info (URL + JWT)', requiresAuth: true, responses: [{ status: 200, description: 'WS info' }, { status: 409, description: 'WSS not patched' }] },

  { path: '/api/vercel/projects', method: 'GET', summary: 'List Vercel projects', requiresAuth: true, responses: [{ status: 200, description: 'Projects' }] },
  { path: '/api/vercel/projects/{pid}/deployments', method: 'GET', summary: 'List deployments', requiresAuth: true, pathParams: [{ name: 'pid', description: 'project id' }], responses: [{ status: 200, description: 'Deployments' }] },
  { path: '/api/vercel/projects/{pid}/deploy', method: 'POST', summary: 'Trigger deploy', requiresAuth: true, requestBody: { required: false, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/vercel/deployments/{id}/logs', method: 'GET', summary: 'Deployment logs', requiresAuth: true, pathParams: [{ name: 'id', description: 'deployment id' }], responses: [{ status: 200, description: 'Logs' }] },

  { path: '/api/github/repos', method: 'GET', summary: 'List GitHub repos', requiresAuth: true, responses: [{ status: 200, description: 'Repos' }] },
  { path: '/api/github/repos/{owner}/{repo}/commits', method: 'GET', summary: 'List commits', requiresAuth: true, responses: [{ status: 200, description: 'Commits' }] },
  { path: '/api/github/repos/{owner}/{repo}/issues', method: 'GET', summary: 'List issues', requiresAuth: true, responses: [{ status: 200, description: 'Issues' }] },
  { path: '/api/github/repos/{owner}/{repo}/issues/create', method: 'POST', summary: 'Create issue (write scope)', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/github/repos/{owner}/{repo}/pulls', method: 'GET', summary: 'List PRs', requiresAuth: true, responses: [{ status: 200, description: 'PRs' }] },
  { path: '/api/github/repos/{owner}/{repo}/pulls/merge', method: 'POST', summary: 'Merge PR (write scope)', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/github/repos/{owner}/{repo}/actions', method: 'GET', summary: 'List CI runs', requiresAuth: true, responses: [{ status: 200, description: 'Runs' }] },

  { path: '/api/gitlab/projects', method: 'GET', summary: 'List GitLab projects', requiresAuth: true, responses: [{ status: 200, description: 'Projects' }] },
  { path: '/api/gitlab/projects/{id}/pipelines', method: 'GET', summary: 'List pipelines', requiresAuth: true, responses: [{ status: 200, description: 'Pipelines' }] },
  { path: '/api/gitlab/projects/{id}/merge-requests', method: 'GET', summary: 'List MRs', requiresAuth: true, responses: [{ status: 200, description: 'MRs' }] },

  { path: '/api/docker/repos', method: 'GET', summary: 'List Docker repos', requiresAuth: true, responses: [{ status: 200, description: 'Repos' }] },
  { path: '/api/docker/repos/{name}/tags', method: 'GET', summary: 'List tags', requiresAuth: true, pathParams: [{ name: 'name', description: 'namespace/name' }], responses: [{ status: 200, description: 'Tags' }] },

  { path: '/api/netlify/sites', method: 'GET', summary: 'List Netlify sites', requiresAuth: true, responses: [{ status: 200, description: 'Sites' }] },
  { path: '/api/netlify/sites/{id}/deploys', method: 'GET', summary: 'List deploys', requiresAuth: true, responses: [{ status: 200, description: 'Deploys' }] },

  { path: '/api/agent/chat', method: 'POST', summary: 'Run agent (one-shot JSON)', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'Result' }] },
  { path: '/api/agent/stream', method: 'POST', summary: 'Run agent (SSE stream)', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'text/event-stream' }] },
  { path: '/api/agent/conversations', method: 'GET', summary: 'List conversations', requiresAuth: true, responses: [{ status: 200, description: 'Conversations' }] },
  { path: '/api/agent/conversations', method: 'POST', summary: 'Create or load conversation', requiresAuth: true, requestBody: { required: false, contentType: 'application/json' }, responses: [{ status: 200, description: 'Conversation + history' }] },
  { path: '/api/agent/conversations', method: 'PATCH', summary: 'Append a message to a conversation', requiresAuth: true, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },

  { path: '/api/notifications', method: 'GET', summary: 'List notifications', requiresAuth: true, queryParams: [{ name: 'limit', type: 'number', description: '1-100' }, { name: 'unread', type: 'string', description: '"1" to filter' }], responses: [{ status: 200, description: 'Notifications' }] },
  { path: '/api/notifications/{id}', method: 'PATCH', summary: 'Mark read', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/notifications/{id}', method: 'DELETE', summary: 'Dismiss', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/notifications/mark-all-read', method: 'POST', summary: 'Mark all read', requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
  { path: '/api/notifications/stream', method: 'GET', summary: 'SSE stream', requiresAuth: true, responses: [{ status: 200, description: 'text/event-stream' }] },

  { path: '/api/activity', method: 'GET', summary: 'List activity', requiresAuth: true, queryParams: [{ name: 'limit', type: 'number', description: '1-100' }], responses: [{ status: 200, description: 'Activity' }] },

  { path: '/api/search', method: 'GET', summary: 'Cross-platform search', requiresAuth: true, queryParams: [{ name: 'q', type: 'string', description: 'query (min 2 chars)' }], responses: [{ status: 200, description: 'Results' }] },

  { path: '/api/csp-report', method: 'POST', summary: 'CSP violation report', requiresAuth: false, requestBody: { required: true, contentType: 'application/json' }, responses: [{ status: 200, description: 'OK' }] },
];

function buildOpenApi() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Bridge API',
      version: '0.1.0',
      description: 'Unified infrastructure control center API. All authenticated routes require a Supabase session cookie.',
    },
    servers: [{ url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mgmt-dash.vercel.app' }],
    components: {
      securitySchemes: {
        cookie: { type: 'apiKey', in: 'cookie', name: 'sb-access-token' },
      },
    },
    paths: ROUTES.reduce<Record<string, Record<string, unknown>>>((acc, r) => {
      const op: Record<string, unknown> = {
        summary: r.summary,
        description: r.description,
        responses: Object.fromEntries(r.responses.map((rr) => [String(rr.status), { description: rr.description }])),
      };
      if (r.requiresAuth) op.security = [{ cookie: [] }];
      if (r.pathParams?.length) {
        op.parameters = r.pathParams.map((p) => ({ name: p.name, in: 'path', required: true, schema: { type: 'string' }, description: p.description }));
      }
      if (r.queryParams?.length) {
        op.parameters = [
          ...((op.parameters as unknown[]) || []),
          ...r.queryParams.map((p) => ({ name: p.name, in: 'query', required: !!p.required, schema: { type: p.type }, description: p.description })),
        ];
      }
      if (r.requestBody) {
        op.requestBody = { required: r.requestBody.required, content: { [r.requestBody.contentType]: { schema: { type: 'object' } } } };
      }
      const key = r.path.replace(/\{(\w+)\}/g, '{$1}');
      acc[key] = acc[key] || {};
      acc[key][r.method.toLowerCase()] = op;
      return acc;
    }, {}),
  };
}

export default buildOpenApi;
