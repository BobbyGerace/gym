import readline from "readline";

export const yNPrompt = (question: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [y/N]\n`, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
};
