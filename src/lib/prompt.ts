import readline from "readline";

export const yNPrompt = async (question: string): Promise<boolean> => {
  const answer = await getAnswer(`${question} [y/N] `);
  return answer.toLowerCase() === "y";
};

type MultiPromptOptions = Record<string, () => Promise<void>>;

// Note that the answer is always lowercased, so the options should be too
export const multiPrompt = async (
  prompt: string,
  options: MultiPromptOptions
): Promise<void> => {
  const answer = await getAnswer(prompt);

  let fn = options[answer.toLowerCase()];
  while (!fn) {
    const invalidPrompt = "Invalid option. Try again or press Ctrl+C to exit.";
    const newAnswer = await getAnswer(invalidPrompt);
    fn = options[newAnswer.toLowerCase()];
  }

  return fn();
};

const getAnswer = async (prompt: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};
