# Codebook: Snake power-ups (example)

Synthetic example derived from the TRACE codebook, with definitions and examples filled in for two codes.

One table per coding sheet in `derived/sheets/`. Code names match the sheet columns.
`values` are the allowed values (agreement and kappa are computed on them); the other columns are for the researchers to fill in.
Free-text `note_*` and `memo` columns are not coded and not part of the agreement statistics.

## `prompts_A1`: Prompts, A1A and A1B

Unit: one row per prompt.

| code                  | values                     | hint                                                                           | definition | include example | exclude example |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------ | ---------- | --------------- | --------------- |
| `req_A1-R1`           | covered / partial / absent | At least two different power-ups                                               | The prompt names two or more distinct power-ups, each with its own effect. | “a speed boost and a score multiplier” | “add some power-ups” without naming any |
| `req_A1-R2`           | covered / partial / absent | Power-ups are temporary                                                        |            |                 |                 |
| `req_A1-R3`           | covered / partial / absent | The player can understand what each power-up does                              |            |                 |                 |
| `req_A1-R4`           | covered / partial / absent | The player can see when a power-up is active                                   |            |                 |                 |
| `req_A1-R5`           | covered / partial / absent | The player can see when the effect ends                                        |            |                 |                 |
| `req_A1-R6`           | covered / partial / absent | The existing game continues to work                                            |            |                 |                 |
| `req_A1-D1`           | covered / partial / absent | Decision: which two power-ups                                                  |            |                 |                 |
| `req_A1-D2`           | covered / partial / absent | Decision: what each power-up does                                              |            |                 |                 |
| `req_A1-D3`           | covered / partial / absent | Decision: how long they last or when they end                                  |            |                 |                 |
| `req_A1-D4`           | covered / partial / absent | Decision: how the player sees an active effect                                 |            |                 |                 |
| `req_A1-D5`           | covered / partial / absent | Decision: what happens when a second power-up is collected while one is active | The prompt says what should happen when a power-up is picked up while another is active. | “a new pickup replaces the active one” | “explain what you chose” (left open) |
| `constraints`         | present / absent           | states what must not change or limits on the solution                          |            |                 |                 |
| `acceptance_criteria` | present / absent           | states how to tell the result is correct                                       |            |                 |                 |
| `over_specification`  | yes / no                   | prescribes implementation details beyond the brief                             |            |                 |                 |
| `decision_ownership`  | student / mixed / agent    | who makes the open design decisions                                            |            |                 |                 |

Free-text columns: `note_student_decisions`, `note_agent_decisions`
