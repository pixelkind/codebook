# Codebook: TRACE visibility study

One table per coding sheet in `derived/sheets/`. Code names match the sheet columns.
`values` are the allowed values (agreement and kappa are computed on them); the other columns are for the researchers to fill in.
Free-text `note_*` and `memo` columns are not coded and not part of the agreement statistics.
`decision_ownership` (student / mixed / agent) was removed from the analysis for now; the column may still exist in the prompt sheets and is ignored.

## `prompts_A1`: Prompts, A1A and A1B

Unit: one row per prompt.

| code                  | values                     | hint                                                                           | definition | include example | exclude example |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------ | ---------- | --------------- | --------------- |
| `req_A1-R1`           | covered / partial / absent | At least two different power-ups                                               |            |                 |                 |
| `req_A1-R2`           | covered / partial / absent | Power-ups are temporary                                                        |            |                 |                 |
| `req_A1-R3`           | covered / partial / absent | The player can understand what each power-up does                              |            |                 |                 |
| `req_A1-R4`           | covered / partial / absent | The player can see when a power-up is active                                   |            |                 |                 |
| `req_A1-R5`           | covered / partial / absent | The player can see when the effect ends                                        |            |                 |                 |
| `req_A1-R6`           | covered / partial / absent | The existing game continues to work                                            |            |                 |                 |
| `req_A1-D1`           | covered / partial / absent | Decision: which two power-ups                                                  |            |                 |                 |
| `req_A1-D2`           | covered / partial / absent | Decision: what each power-up does                                              |            |                 |                 |
| `req_A1-D3`           | covered / partial / absent | Decision: how long they last or when they end                                  |            |                 |                 |
| `req_A1-D4`           | covered / partial / absent | Decision: how the player sees an active effect                                 |            |                 |                 |
| `req_A1-D5`           | covered / partial / absent | Decision: what happens when a second power-up is collected while one is active |            |                 |                 |
| `constraints`         | present / absent           | states what must not change or limits on the solution                          |            |                 |                 |
| `acceptance_criteria` | present / absent           | states how to tell the result is correct                                       |            |                 |                 |
| `over_specification`  | yes / no                   | prescribes implementation details beyond the brief                             |            |                 |                 |

Free-text columns: `note_student_decisions`, `note_agent_decisions`

## `A1_q1_prompt_differences`: Moodle Reflection: A1 - Q1 - Prompt differences

Question: What were the most important differences between the two prompts?

Unit: one row per student.

| code                 | values                   | hint                                                         | definition | include example                             | exclude example |
| -------------------- | ------------------------ | ------------------------------------------------------------ | ---------- | ------------------------------------------- | --------------- |
| `examples`           | yes / no                 | Did the students use an example?                             |            |                                             |                 |
| `structure`          | own / AI / not mentioned | Did the students mention structure?                          |            | can include: informal, precise, specificity |                 |
| `detail`             | own / AI / not mentioned | Did the students mention detail?                             |            | can include: informal, precise, specificity |                 |
| `ui-ux`              | own / AI / not mentioned | Did the students mention UI or UX related topics?            |            |                                             |                 |
| `clean_code`         | own / AI / not mentioned | Did the students mention Code Quality?                       |            |                                             |                 |
| `longer`             | own / AI / not mentioned | Did the students mention that one prompt was longer?         |            |                                             |                 |
| `markdown`           | own / AI / not mentioned | Did the students mention that markdown was used in a prompt? |            |                                             |                 |
| `verification`       | own / AI / not mentioned | Did the students mention verification in some way?           |            |                                             |                 |
| `tests`              | own / AI / not mentioned | Did the students mention tests?                              |            | Can include: edge-cases, avoiding bugs, etc |                 |
| `agents_md`          | own / AI / not mentioned | Did the students mention AGENTS.md?                          |            |                                             |                 |
| `over_specification` | own / AI / not mentioned | Did the students mention over specification?                 |            |                                             |                 |

Free-text columns: `note`

## `A1_q2_differences_effect`: Moodle Reflection: A1 - Q2 - Differences - Effect

Question: Did those differences affect the result? Give one example.

Unit: one row per student.

| code               | values                    | hint                                                            | definition | include example | exclude example |
| ------------------ | ------------------------- | --------------------------------------------------------------- | ---------- | --------------- | --------------- |
| `differences`      | yes / no / partly         | Is there a difference?                                          |            |                 |                 |
| `examples`         | mentioned / not mentioned | Did the students use an example?                                |            |                 |                 |
| `decision_support` | mentioned / not mentioned | Did the students talk about getting support in decision making? |            |                 |                 |
| `preference`       | yes / no / not mentioned  | Did the students prefer one prompt over the other?              |            |                 |                 |

Free-text columns: `note`

## `A1_q5_chosen_implementation`: Moodle Reflection: A1 - Q5 - Chosen implementation

Question: Which implementation did you choose, and why?

Unit: one row per student.

| code                     | values                           | hint                                                                             | definition | include example                            | exclude example |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | --------------- |
| `choice`                 | own / AI / not clear / not valid | Which decision did the students chose?                                           |            |                                            |                 |
| `tests`                  | mentioned / not mentioned        | Did the students mention tests?                                                  |            |                                            |                 |
| `examples`               | mentioned / not mentioned        | Did the students mention an example?                                             |            |                                            |                 |
| `save_time`              | mentioned / not mentioned        | Did the students mention saving time?                                            |            |                                            |                 |
| `code_quality`           | mentioned / not mentioned        | Did the students mention the code quality?                                       |            |                                            |                 |
| `ui-ux`                  | mentioned / not mentioned        | Did the students mention things related to UI or UX?                             |            |                                            |                 |
| `matches_intent`         | mentioned / not mentioned        | Did the students mention that the version matches their intent?                  |            | Also includes mention that it matches more |                 |
| `human-ai-collaboration` | mentioned / not mentioned        | Did the students mention something about the collaboration between human and AI? |            |                                            |                 |
| `not_happy`              | mentioned / not mentioned        | Did the students mention that they are not happy with either version?            |            |                                            |                 |

Free-text columns: `note`

## `A1_q6_easier_to_review`: Moodle Reflection: A1 - Q6 - Easier to review

Question: Was one result easier to understand or review?

Unit: one row per student.

| code               | values                    | hint                                            | definition | include example                            | exclude example |
| ------------------ | ------------------------- | ----------------------------------------------- | ---------- | ------------------------------------------ | --------------- |
| `easier_to_review` | own / AI / similar        | Which one was easier to review?                 |            |                                            |                 |
| `tests`            | mentioned / not mentioned | Did the students mention tests as a reason?     |            |                                            |                 |
| `summary`          | mentioned / not mentioned | Did the students mention a summary as a reason? |            |                                            |                 |
| `diff`             | mentioned / not mentioned | Did the students mention the diff?              |            | Also includes everything related to length |                 |
| `structure`        | mentioned / not mentioned | Did the students mention the structure?         |            |                                            |                 |
| `problem_in_code`  | mentioned / not mentioned |                                                 |            |                                            |                 |
| `code_quality`     | mentioned / not mentioned | Did the students mention the code quality?      |            |                                            |                 |

Free-text columns: `note`

## `A1_q7_do_differently`: Moodle Reflection: A1 - Q7 - Do differently

Question: What would you do differently when formulating a task next time?

Unit: one row per student.

| code                     | values                    | hint                                                                                     | definition | include example                                       | exclude example |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------- | --------------- |
| `tests`                  | mentioned / not mentioned | Do the student want to use tests in the future?                                          |            |                                                       |                 |
| `precision_detail`       | mentioned / not mentioned | Do the student want to be more precise/add more details in the future?                   |            |                                                       |                 |
| `think_read_understand`  | mentioned / not mentioned | Do the student want to think/read/understand the assignment/prompt better in the future? |            |                                                       |                 |
| `edge-cases`             | mentioned / not mentioned | Do the student want to define edge-cases in the future?                                  |            |                                                       |                 |
| `ui-ux`                  | mentioned / not mentioned | Do the student want to be more explicit about UI/UX topics in the future?                |            |                                                       |                 |
| `delegation`             | mentioned / not mentioned | Do the student want to be more aware what the delegate in the future?                    |            | Also include everything around decision making        |                 |
| `decomposition`          | mentioned / not mentioned | Do the student want to decompose tasks more in the future?                               |            |                                                       |                 |
| `markdown`               | mentioned / not mentioned | Do the student want to use markdown in the future?                                       |            |                                                       |                 |
| `human-ai-collaboration` | mentioned / not mentioned | Do the student want to collaborate more with the AI in the future?                       |            | Also include topics around intent and matching intent |                 |
| `constraints`            | mentioned / not mentioned | Do the student want to define better/more constraints in the future?                     |            |                                                       |                 |

Free-text columns: `note`
