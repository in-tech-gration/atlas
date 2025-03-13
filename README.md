# ATLAS-FABRIC

A Node.js implementation of [fabric](https://github.com/danielmiessler/fabric/).

**NOTE:** Work in progress. Under heavy development.

## EXAMPLES:

Example using [Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/) model:

```bash
echo "USA and EU" | atlas pattern explain_terms
```

Output:

```markdown
## USA: 
The United States of America is a country located primarily in North America. It is considered one of the most powerful countries globally due to its economic, military, and political influence.

## EU:
The European Union is a politico-economic union of 27 member states, each with its own government and laws but cooperating on trade, security, and other policies through common institutions.

However, the provided input appears more related to general geography or global politics rather than an in-depth explanation requiring advanced terms. If you'd like me to explain something specific or provide examples involving these entities, please let me know.
```

Alternative input strategy: 

```bash
atlas pattern explain_terms "USA and EU"
```

Example using [Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/) model with a text file as input:

```bash
cat example.txt | atlas pattern explain_terms
```

```markdown
## ABSTRACTION LAYER: 
A layer of the Internet protocol suite that provides a conceptual separation between different network functions and protocols, allowing for classification and organization.
-- Analogy: A library's cataloging system that groups books by genre or author to facilitate searching and retrieval.
-- Why It Matters: The abstraction layers help in understanding how data is communicated over networks and which protocols are involved at each stage.

## DEPARTMENT OF DEFENSE (DoD) MODEL:
A historical term for the early versions of the Internet protocol suite, as it was initially funded by the United States Department of Defense through DARPA.
-- Analogy: A prototype or beta version of a software that is refined and improved over time to become a standard.
-- Why It Matters: The DoD model highlights the origins and evolution of the Internet protocol suite.

## INTERNET ENGINEERING TASK FORCE (IETF):
A technical standards organization responsible for maintaining and developing the Internet protocol suite and its constituent protocols.
-- Analogy: A governing body that sets rules and regulations for a particular sport, ensuring consistency and fairness across different leagues.
-- Why It Matters: The IETF ensures the stability and interoperability of the Internet protocol suite.

... (truncated)
```

## TODO

- [x] `-p, --pattern              Choose a pattern from the available patterns`
- [ ] `-t, --temperature=         Set temperature (default: 0.7)`
- [ ] `-s, --stream               Stream`
- [ ] `-l, --listpatterns         List all patterns`
- [ ] `-L, --listmodels           List all available models`
- [ ] `-o, --output=              Output to file`
- [ ] `-c, --copy                 Copy to clipboard`
