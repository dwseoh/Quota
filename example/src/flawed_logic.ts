/* example file for integration-style detector tests */

const db = { users: { find: () => [] as unknown[] } };

export async function nestedLoops() {
  while (true) {
    const results = db.users.find();
    for (const user of results) {
      await fetch('https://api.stripe.com/v1/charges');
    }
  }
}

export async function openaiLoop() {
  const openai = { chat: { completions: { create: async (_x: unknown) => {} } } };
  for (let i = 0; i < 10; i++) {
    await openai.chat.completions.create({ model: 'gpt-4' });
  }
}

const legacyModel = 'gpt-4-32k';

export async function badDatabasePractices() {
  const docClient = { scan: async (_x: unknown) => {} };
  await docClient.scan({ TableName: 'Users' });
  const q = 'SELECT * FROM users';
  void legacyModel;
  void q;
}
