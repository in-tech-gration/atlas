# ATLAS-FABRIC

## A Node.js implementation **(beta)** of [fabric](https://github.com/danielmiessler/fabric/) using [LangChain](https://js.langchain.com/docs/introduction/).

<p class="align center">
<h4><code>fabric</code> is an open-source framework for augmenting humans using AI.</h4>
</p>

> [!WARNING]
> Work in progress. Under heavy development.

## WHAT IS FABRIC?

Check out the [Introducing Fabric — A Human AI Augmentation Framework](https://www.youtube.com/watch?v=wPEyyigh10g) video by the original creator Daniel Meissler.

## INSTALLATION

  - `git clone git@github.com:in-tech-gration/atlas.git`
  - `cd atlas`
  - `npm install`
  - `npm link`
  - `atlas --help`

  **Prerequisites:**

  - Install [Ollama](https://ollama.com/)
  - Run `Ollama` and install `llama3.1:latest` model

## AVAILABLE OPTIONS

  - `-p, --pattern <pattern...>`
  - `-t, --temperature [temperature]`
  - `-l, --listpatterns`

  More to come...

## EXAMPLES:

Examples using [Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/) model:

_(Requires [Ollama](https://ollama.com/))_

```bash
cat example.txt | atlas --pattern create_tags
# or                               
cat example.txt | atlas -p create_tags
```

Output:

```markdown
tcp/ip internet protocol suite transmission control protocol user datagram protocol ip tcp udp ip address network segment host to host communication process to process data exchange department of defense darpa internet engineering task force ietf osi model
```

---

```bash
atlas --pattern ai "What is the -s parameter in cURL?"
# or
atlas -p ai "What is the -s parameter in cURL?"
```

Output:

```markdown
* The `-s` parameter in `cURL` stands for silent mode.
* It prevents cURL from showing its progress meter and messages.
* Silent mode suppresses informational output.
```
---

```bash
echo "USA and EU" | atlas --pattern explain_terms
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
atlas --pattern explain_terms "USA and EU"
```

---

```bash
cat example.txt | atlas -p explain_terms -t 0
# or
cat example.txt | atlas --pattern explain_terms --temperature 0
```

Output:

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

- [ ] Publish on NPM
- [ ] Port to TypeScript
- [ ] Write Unit Tests
- [ ] Enable ESLint
- [ ] Introduce Agentic workflows based on LangGraph
- [ ] Integrate LLM APIs
- [ ] Add Chat mode

Options:

- [x] `-p, --pattern              Choose a pattern from the available patterns`
- [x] `-t, --temperature=         Set temperature (default: 0.7)`
- [x] `-l, --listpatterns         List all patterns`
- [ ] `-s, --stream               Stream`
- [ ] `-L, --listmodels           List all available models`
- [ ] `-o, --output=              Output to file`
- [ ] `-c, --copy                 Copy to clipboard`

---

`fabric` was created by <a href="https://danielmiessler.com/subscribe" target="_blank">Daniel Miessler</a> in January of 2024.

<br />

`atlas-fabric` was created by <a href="https://github.com/kostasx" target="_blank">Kostas Minaidis</a> in March of 2025.

<br />

<a href="https://twitter.com/intent/user?screen_name=kostasx">![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/kostasx)</a>
