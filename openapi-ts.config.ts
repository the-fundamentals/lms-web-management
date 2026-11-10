import { defineConfig } from '@hey-api/openapi-ts';

// Hey API emits useQuery functions. The linked openapi-typescript tool emits types only.
export default defineConfig({
  input: './openapi.yml',
  output: 'src/generated',
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@tanstack/react-query',
      useQuery: true,
      queryOptions: true,
      mutationOptions: true,
    },
  ],
});
