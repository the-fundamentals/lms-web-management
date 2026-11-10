# Unit Story Map

No user stories were produced. Rows are the functional requirements in `requirements.md`, plus the non-functional requirements from that file. A requirement with children is traced through those children. Several units in one cell are separated with `;`. A unit is named only where it implements part of that row. `components.md` is the component split these units group.

| Requirement | Unit ID | Directory |
|---|---|---|
| FR1.1 | U2; U3 | u2-auth; u3-classroom |
| FR1.2 | U2; U3 | u2-auth; u3-classroom |
| FR1.3 | U2 | u2-auth |
| FR1.4 | U2 | u2-auth |
| FR1.5 | U2 | u2-auth |
| FR1.6 | U2 | u2-auth |
| FR2.1 | U3; U8 | u3-classroom; u8-app |
| FR2.2 | U3 | u3-classroom |
| FR2.3 | U3 | u3-classroom |
| FR2.4 | U3 | u3-classroom |
| FR2.5 | U3; U5 | u3-classroom; u5-schedule |
| FR2.6 | U3 | u3-classroom |
| FR3.1 | U4 | u4-members |
| FR3.2 | U4 | u4-members |
| FR3.3 | U4 | u4-members |
| FR3.4 | U4 | u4-members |
| FR3.5 | U4 | u4-members |
| FR4.1 | U5 | u5-schedule |
| FR4.2 | U5 | u5-schedule |
| FR4.3 | U5 | u5-schedule |
| FR4.4 | U5 | u5-schedule |
| FR4.5 | U5 | u5-schedule |
| FR4.6 | U5 | u5-schedule |
| FR4.7 | U5 | u5-schedule |
| FR4.8 | U5 | u5-schedule |
| FR4.9 | U5 | u5-schedule |
| FR5.1 | U6 | u6-payment |
| FR5.2 | U6 | u6-payment |
| FR5.3 | U6 | u6-payment |
| FR5.4 | U6 | u6-payment |
| FR5.5 | U6 | u6-payment |
| FR5.6 | U6 | u6-payment |
| FR5.7 | U6 | u6-payment |
| FR5.8 | U6 | u6-payment |
| FR6.1 | U1 | u1-shared |
| FR6.2 | U1; U5 | u1-shared; u5-schedule |
| FR7.1 | U0; U1; U2; U8 | u0-design-system; u1-shared; u2-auth; u8-app |
| FR7.2 | U1 | u1-shared |
| FR7.3 | U1 | u1-shared |
| FR7.4 | U2; U8 | u2-auth; u8-app |
| FR7.5 | U1 | u1-shared |
| FR8.1 | U7; U8 | u7-tools; u8-app |
| FR8.2 | U7 | u7-tools |
| FR8.3 | U6; U7 | u6-payment; u7-tools |
| FR8.4 | U2; U3; U4; U5; U6; U8 | u2-auth; u3-classroom; u4-members; u5-schedule; u6-payment; u8-app |
| NFR1 | U8 | u8-app |
| NFR2 | U0; U1; U2; U3; U4; U5; U6; U7; U8 | u0-design-system; u1-shared; u2-auth; u3-classroom; u4-members; u5-schedule; u6-payment; u7-tools; u8-app |
| NFR3 | U0 | u0-design-system |
| NFR6 | U0 | u0-design-system |
| NFR7 | U0 | u0-design-system |
| NFR4 | U1; U2 | u1-shared; u2-auth |
| NFR5 | U1 | u1-shared |

## Cross-cutting rows

FR2.5, FR6.2, FR7.1, FR7.4, FR8.1, FR8.3, FR8.4, NFR2, and NFR4 each name more than one unit. The rest are one unit.

## Coverage

Every FR child and every NFR is in the table. Every unit appears at least once: U0 on NFR3, U1 on FR6.1, U2 on FR1.3, U3 on FR2.2, U4 on FR3.1, U5 on FR4.1, U6 on FR5.1, U7 on FR8.2, U8 on FR2.1.
