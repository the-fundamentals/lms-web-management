# Domain Design Questions

## Q1. [Product owner] How should the app be split?

The five slices are sign-in and home, classrooms, people, schedule and attendance, and money. Tools must stay removable. This chooses the parts the code is built in.

A. One part for each slice, plus a removable Tools part
B. Two parts: the teacher app, and a removable Tools part
C. Not yet defined
X. Other (please specify)

[Answer]: Divide it into feature slices. Follow the frontend-architecture-skill. The tools slice should be a separate feature or utility or something suitable.

## Q2. [Product owner] Where do calls to the backend live?

Sign-in, the 15-second wait, and the shared error screen have to live in one place either way.

A. Each part calls the backend itself. Sign-in, loading, and errors stay in one shared place
B. Every part calls one gateway, and only that gateway talks to the backend
C. Not yet defined
X. Other (please specify)

[Answer]: There is an openapi.yml spec. Generate TypeScript TanStack Query stubs with OpenAPI-ts (https://openapi-ts.dev/introduction). If that is not possible, ask. Put the stubs in src/generated, and ignore that folder in git. Each part calls these stub functions.

## Q3. [Product owner] Which generator should write the backend stubs?

The library at that link writes TypeScript types. It does not write a TanStack Query function per endpoint. A different generator does write those functions.

A. Keep the linked library. It writes types into src/generated. Features use TanStack Query with those types. No generated query function per endpoint.
B. Use Hey API's generator. It writes TanStack Query functions into src/generated, and each feature calls those. It is not the library at that link.
C. Not yet defined
X. Other (please specify)

[Answer]: Use Hey API's generator with the TanStack Query plugin to generate TanStack Query useQuery functions you can use.

## Consolidated Summary Confirmation

- The app is split into features. A feature may import shared code. A feature does not import another feature.
- Tools is its own feature. No other feature imports it, so that folder can be removed.
- Sign-in, the wait, and the shared error screen live in one shared place.
- Hey API's generator, with the TanStack Query plugin, writes useQuery functions into src/generated from openapi.yml. That folder is gitignored. Each feature calls those functions.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
