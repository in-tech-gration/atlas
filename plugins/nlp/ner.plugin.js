import { execSync } from 'child_process';
import clipboardy from 'clipboardy';

/**
 * @param {object} options _
 * @param {object} globalOptions _
 * @param {object} cliInstance _
 * @returns {object} The object containing the entities
 */
export default function ner(options, globalOptions, cliInstance) {

  const userInput = options.join(" ");

  const pythonCmd = getPythonCommand();

  if (!pythonCmd) {
    console.error('Python is not installed or not found in system PATH.');
    process.exit(1);
  }

  if (!isSpacyInstalled(pythonCmd)) {

    console.error('spaCy is not installed. Install it using: pip install spacy && python -m spacy download en_core_web_sm');
    process.exit(1);

  }

  // Base64 encode user input to safely pass strings containing quotes/special characters 
  // into the python -c command line argument without risk of syntax errors or injection.
  const encodedInput = Buffer.from(userInput).toString('base64');

  const pythonCode = `import spacy, json, base64; nlp = spacy.load('en_core_web_sm'); text = base64.b64decode('${encodedInput}').decode('utf-8'); doc = nlp(text); entities = [(ent.text, ent.label_) for ent in doc.ents]; data = [{'text': t, 'label': l} for t, l in entities]; print(json.dumps(data, indent=2))`;

  try {
    const result = execSync(`${pythonCmd} -c "${pythonCode}"`, { encoding: 'utf-8' });
    // console.log('\nExtracted Entities:');
    const resultTrimmed = result.trim();
    const json = JSON.parse(resultTrimmed)
    console.log(json);
    clipboardy.writeSync(resultTrimmed);
  } catch (error) {
    console.error('Execution failed:', error.stderr || error.message);
  }

  return null;

}

// Find available python executable across platforms (Mac, Linux, Windows)
function getPythonCommand() {
  const commands = ['python3', 'python'];
  for (const cmd of commands) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
      return cmd;
    } catch (e) {
      // console.log(e);
    }
  }
  return null;
}

// Check if spaCy is installed for the given python environment
function isSpacyInstalled(pythonCmd) {
  try {
    execSync(`${pythonCmd} -c "import spacy"`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

