# Units Generation Questions

## Q1. [Architect] How should the parts be grouped into units?

A unit is a chunk that can be built and checked on its own. The parts are sign-in, classrooms, people, schedule, money, and Tools. Home is the classroom list. Tools must stay removable. This does not choose which chunk is built first.

A. One unit per slice, plus a shared library, plus a removable Tools library. Sign-in depends on classrooms because home is that list. People, schedule, and money depend only on the shared library
B. One website unit, and Tools as its own library. The five slices stay folders inside the website
C. Not yet defined
X. Other (please specify)

[Answer]: Follow /frontend-architecture-skill. Divide the domain into features like auth, payment, classroom, members...

## Q2. [Architect] How does it ship?

A. One website, one deploy. The units are parts of that site
B. Each unit ships on its own
C. Not yet defined
X. Other (please specify)

[Answer]: 1. One website, one deploy. This is the Web Management app, so a React application running tanstack query, and tanstack router. It's management so no SSR (yet)

## Q3. [Architect] Which features, and where do routes and the client live?

The skill puts routes in `app`, the API client in `shared`, and each slice in `features`. A feature may import `shared`. A feature does not import another feature. Schedule and Tools were already required and were not in the examples.

A. `app` wires TanStack Router and may import features. `shared` holds the client, loading, errors, and GMT+7. Features are auth, classroom, members, schedule, payment, and tools. No other feature imports tools
B. Only auth, payment, classroom, and members. Schedule lives inside classroom. Tools lives inside auth
C. Not yet defined
X. Other (please specify)

[Answer]: Do the path of least resistance with tanstack router. Follow their defaults, and update the architecture skill to use whatever tanstack router uses

## Consolidated Summary Confirmation

- One React site, one deploy. TanStack Query holds server data. TanStack Router uses file-based routing. No SSR.
- Router defaults stay as shipped: routes in `src/routes`, generated tree at `src/routeTree.gen.ts`, and a leading `-` marks a file that is not a route. No virtual routes.
- `__root.tsx` is the root layout. `_authenticated` is the signed-in shell. The signed-in home is the classroom list, so that index route lives with classroom. Sign-in stays outside the signed-in shell.
- Route directories are auth, classroom, members, schedule, payment, and tools. Each may import `src/shared` for the client, loading, errors, and GMT+7. A route directory does not import another. No other route directory imports tools.
- `shared` is a library unit. Each route directory is a ui unit and depends only on `shared`. The app unit holds the root, the signed-in layout, and the generated tree, and it depends on the route units. Those route units do not depend on each other.
- The architecture skill now uses this layout.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
