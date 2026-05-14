// TODO: esses componentes ainda usam o cliente Supabase e precisam ser migrados para a API Fastify.
// Stub temporário para manter o build funcionando até a migração completa.
export const supabase = {
  from: (_table: string) => ({
    select: (_cols?: string) => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
    insert: (_data: unknown) => Promise.resolve({ data: null, error: null }),
    update: (_data: unknown) => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
  }),
  channel: (_name: string) => ({
    on: (_event: string, _filter: unknown, _cb: unknown) => ({
      subscribe: (_cb?: unknown) => ({ unsubscribe: () => {} }),
    }),
  }),
  removeChannel: (_channel: unknown) => Promise.resolve(),
  storage: {
    from: (_bucket: string) => ({
      upload: (_path: string, _file: unknown) => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
  functions: {
    invoke: (_name: string, _opts?: unknown) => Promise.resolve({ data: null, error: null }),
  },
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any
