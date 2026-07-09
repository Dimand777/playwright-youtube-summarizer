import { Telegraf } from 'telegraf';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedUser = process.env.TELEGRAM_ALLOWED_USER_ID;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!token) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is not defined in your .env file!');
  process.exit(1);
}

const bot = new Telegraf(token);

// Simple session store for chat history
interface ContentPart {
  text?: string;
  functionCall?: {
    name: string;
    args: any;
  };
  functionResponse?: {
    name: string;
    response: any;
  };
}

interface Content {
  role: 'user' | 'model' | 'function';
  parts: ContentPart[];
}

let chatHistory: Content[] = [];
const MAX_HISTORY = 30; // limit history to avoid hitting token limits

// Access control middleware
bot.use((ctx, next) => {
  const userId = ctx.from?.id.toString();
  
  if (!allowedUser) {
    ctx.reply('⚠️ Бот запущен, но доступ ограничен. Пожалуйста, укажите TELEGRAM_ALLOWED_USER_ID в файле .env.');
    console.warn(`\n[WARNING] Incoming message from Telegram User ID: ${userId}.`);
    console.warn(`[WARNING] To allow this user, copy this ID and add it to your .env file:`);
    console.warn(`TELEGRAM_ALLOWED_USER_ID=${userId}\n`);
    return;
  }
  
  if (userId !== allowedUser) {
    ctx.reply('⛔ Доступ запрещен. Этот бот настроен на работу только со своим владельцем.');
    console.warn(`Unauthorized access attempt from User ID: ${userId}`);
    return;
  }
  
  return next();
});

// Tools Definition for Gemini API
const toolsSpec = [
  {
    functionDeclarations: [
      {
        name: 'runCommand',
        description: 'Выполняет консольную команду в PowerShell на компьютере пользователя и возвращает вывод (stdout/stderr).',
        parameters: {
          type: 'OBJECT',
          properties: {
            command: {
              type: 'STRING',
              description: 'Команда для запуска, например "npm test" или "git status".'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'readFile',
        description: 'Читает содержимое текстового файла на диске.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filePath: {
              type: 'STRING',
              description: 'Абсолютный или относительный путь к файлу.'
            }
          },
          required: ['filePath']
        }
      },
      {
        name: 'writeFile',
        description: 'Создает новый файл или полностью перезаписывает существующий файл переданным контентом.',
        parameters: {
          type: 'OBJECT',
          properties: {
            filePath: {
              type: 'STRING',
              description: 'Абсолютный или относительный путь к файлу.'
            },
            content: {
              type: 'STRING',
              description: 'Текстовое содержимое файла.'
            }
          },
          required: ['filePath', 'content']
        }
      },
      {
        name: 'listDirectory',
        description: 'Возвращает список файлов и папок в указанной директории.',
        parameters: {
          type: 'OBJECT',
          properties: {
            directoryPath: {
              type: 'STRING',
              description: 'Путь к директории (по умолчанию ".").'
            }
          }
        }
      },
      {
        name: 'sendReport',
        description: 'Запаковывает текущую папку отчетов playwright-report в ZIP-архив и отправляет файл пользователю в Telegram.'
      }
    ]
  }
];

// Tools Implementations
function executeRunCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += '\nERRORS/WARNINGS:\n' + stderr;
      if (error) output += `\nEXECUTION ERROR: ${error.message}`;
      resolve(output || 'Команда выполнена успешно, без вывода.');
    });
  });
}

function executeRunCommandAsync(command: string, ctx: any): void {
  ctx.reply(`🚀 Запустил команду \`${command}\` в фоновом режиме на компьютере. Результаты пришлю сюда, как только они завершатся.`, { parse_mode: 'Markdown' }).catch(() => {});
  
  exec(command, { shell: 'powershell.exe' }, async (error, stdout, stderr) => {
    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += '\nERRORS/WARNINGS:\n' + stderr;
    if (error) output += `\nEXECUTION ERROR: ${error.message}`;
    
    // Split output if too long
    const maxLen = 4000;
    if (output.length <= maxLen) {
      await ctx.reply(`📋 Результаты выполнения команды \`${command}\`:\n\`\`\`\n${output}\n\`\`\``, { parse_mode: 'Markdown' }).catch(() => {});
    } else {
      const logPath = path.resolve(__dirname, 'command-execution.log');
      fs.writeFileSync(logPath, output);
      await ctx.reply(`📋 Выполнение команды \`${command}\` завершено. Вывод отправляю файлом...`, { parse_mode: 'Markdown' }).catch(() => {});
      await ctx.replyWithDocument({ source: logPath, filename: 'command-execution.log' }).catch(() => {});
      try { fs.unlinkSync(logPath); } catch {}
    }
    
    // If it was tests, automatically send the report
    const cmdLower = command.toLowerCase();
    if (cmdLower.includes('test') || cmdLower.includes('playwright')) {
      const reportDir = path.resolve(__dirname, 'playwright-report');
      if (fs.existsSync(reportDir)) {
        await ctx.reply('📦 Создаю и отправляю архив с HTML-отчетом...').catch(() => {});
        await executeSendReport(ctx);
      }
    }
  });
}

function executeReadFile(filePath: string): string {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      return `Ошибка: Файл не найден по пути ${resolvedPath}`;
    }
    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      return `Ошибка: Указанный путь ${resolvedPath} не является файлом`;
    }
    return fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err: any) {
    return `Ошибка при чтении файла: ${err.message}`;
  }
}

function executeWriteFile(filePath: string, content: string): string {
  try {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, content, 'utf-8');
    return `Файл ${resolvedPath} успешно записан (${content.length} символов).`;
  } catch (err: any) {
    return `Ошибка при записи файла: ${err.message}`;
  }
}

function executeListDirectory(directoryPath: string = '.'): string {
  try {
    const resolvedPath = path.resolve(directoryPath);
    if (!fs.existsSync(resolvedPath)) {
      return `Ошибка: Директория не найдена по пути ${resolvedPath}`;
    }
    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return `Ошибка: Указанный путь ${resolvedPath} не является директорией`;
    }
    const files = fs.readdirSync(resolvedPath);
    return files.map(file => {
      const isDir = fs.statSync(path.join(resolvedPath, file)).isDirectory();
      return `${isDir ? '📁' : '📄'} ${file}`;
    }).join('\n') || 'Директория пуста.';
  } catch (err: any) {
    return `Ошибка при получении списка файлов: ${err.message}`;
  }
}

async function executeSendReport(ctx: any): Promise<string> {
  const reportDir = path.resolve(__dirname, 'playwright-report');
  
  if (!fs.existsSync(reportDir)) {
    return 'Ошибка: Папка с отчетами playwright-report не найдена. Сначала запустите тесты.';
  }
  
  const zipPath = path.resolve(__dirname, 'playwright-report.zip');
  
  try {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    const zipCommand = `Compress-Archive -Path "${reportDir}" -DestinationPath "${zipPath}" -Force`;
    await executeRunCommand(zipCommand);
    
    if (fs.existsSync(zipPath)) {
      await ctx.replyWithDocument({ source: zipPath, filename: 'playwright-report.zip' });
      fs.unlinkSync(zipPath);
      return 'Отчет успешно упакован и отправлен пользователю в виде файла playwright-report.zip';
    } else {
      return 'Ошибка: Не удалось создать архив отчета.';
    }
  } catch (err: any) {
    return `Ошибка при отправке отчета: ${err.message}`;
  }
}

// Function to call Gemini API
async function callGemini(contents: Content[]): Promise<any> {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      tools: toolsSpec,
      systemInstruction: {
        parts: [
          {
            text: 'Вы — локальный ИИ-ассистент разработчика, запущенный на его компьютере. ' +
                  'Вы общаетесь с пользователем в Telegram на русском языке. ' +
                  'У вас есть доступ к локальным инструментам для запуска консольных команд, чтения и записи файлов. ' +
                  'Вы должны помогать пользователю разрабатывать и тестировать его проект. ' +
                  'Запускайте инструменты сразу, как только пользователь дает команду (например, просит запустить тесты или прочитать файл), не требуя дополнительного подтверждения. Кратко описывайте, что вы делаете.'
          }
        ]
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (status ${response.status}): ${errorText}`);
  }

  return response.json();
}

// Handle Bot commands
bot.start((ctx) => {
  ctx.reply(
    '👋 Привет! Теперь я умный ИИ-помощник, подключенный к твоей системе через Gemini API.\n\n' +
    'Ты можешь писать мне обычными сообщениями, например:\n' +
    '• "покажи файлы в проекте"\n' +
    '• "запусти тесты"\n' +
    '• "покажи содержимое файла package.json"\n\n' +
    'Команды бота:\n' +
    '🧹 /clear - Очистить историю диалога (контекст)\n' +
    '❓ /help - Показать это сообщение'
  );
});

bot.command('help', (ctx) => {
  ctx.reply(
    '💡 Напишите мне любой запрос простыми словами. Я могу:\n' +
    '1. Запускать команды консоли (через runCommand)\n' +
    '2. Читать файлы (через readFile)\n' +
    '3. Записывать/создавать файлы (через writeFile)\n' +
    '4. Смотреть папки (через listDirectory)\n\n' +
    'Используйте /clear, чтобы сбросить контекст беседы.'
  );
});

bot.command('clear', (ctx) => {
  chatHistory = [];
  ctx.reply('🧹 История диалога успешно очищена! Начнем с чистого листа.');
});

// Handle text messages
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  // Add user message to history
  chatHistory.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Keep history size within limits
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY);
  }

  let statusMessage;
  try {
    statusMessage = await ctx.reply('🤔 Думаю...');
    
    let loop = true;
    let loopCount = 0;
    const MAX_LOOPS = 5;

    while (loop && loopCount < MAX_LOOPS) {
      loopCount++;
      const result = await callGemini(chatHistory);

      const candidate = result.candidates?.[0];
      const content = candidate?.content;
      
      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      // Add model's response to history
      chatHistory.push({
        role: 'model',
        parts: content.parts
      });

      const part = content.parts?.[0];

      if (part?.functionCall) {
        const { name, args } = part.functionCall;
        
        // Update status message in Telegram to show what tool is running
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMessage.message_id,
          undefined,
          `⚙️ Вызываю инструмент: \`${name}\` с параметрами: \`${JSON.stringify(args)}\`...`
        );

        let toolOutput = '';
        if (name === 'runCommand') {
          const cmdLower = args.command.toLowerCase();
          if (cmdLower.includes('test') || cmdLower.includes('playwright') || cmdLower.includes('install')) {
            executeRunCommandAsync(args.command, ctx);
            toolOutput = `Команда "${args.command}" успешно запущена в фоновом режиме на компьютере. Результаты выполнения и архив отчетов будут отправлены в этот чат сразу по завершении.`;
          } else {
            toolOutput = await executeRunCommand(args.command);
          }
        } else if (name === 'readFile') {
          toolOutput = executeReadFile(args.filePath);
        } else if (name === 'writeFile') {
          toolOutput = executeWriteFile(args.filePath, args.content);
        } else if (name === 'listDirectory') {
          toolOutput = executeListDirectory(args.directoryPath);
        } else if (name === 'sendReport') {
          toolOutput = await executeSendReport(ctx);
        } else {
          toolOutput = `Error: Tool ${name} not found`;
        }

        // Add function response to history
        chatHistory.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name,
              response: { output: toolOutput }
            }
          }]
        });

      } else if (part?.text) {
        // Model returned a text response, so we are done
        const replyText = part.text;
        
        // Delete the typing status message and send the final response
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, statusMessage.message_id);
        } catch {}

        // Send response (handling markdown if possible, but fallback to plain text if markdown parse fails)
        try {
          await ctx.reply(replyText, { parse_mode: 'Markdown' });
        } catch (err) {
          // If formatting fails due to bad markdown, send as plain text
          await ctx.reply(replyText);
        }
        
        loop = false;
      } else {
        loop = false;
      }
    }

    if (loopCount >= MAX_LOOPS) {
      await ctx.reply('⚠️ Достигнут лимит вызова инструментов в рамках одного сообщения.');
    }

  } catch (error: any) {
    console.error('Error handling message:', error);
    try {
      if (statusMessage) {
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMessage.message_id);
      }
    } catch {}
    
    if (!geminiApiKey) {
      await ctx.reply('⚠️ Ошибка: В файле `.env` отсутствует или пустой `GEMINI_API_KEY`. Укажите его, чтобы включить ИИ-ассистента.');
    } else {
      await ctx.reply(`❌ Произошла ошибка: ${error.message || error}`);
    }
  }
});

bot.catch((err, ctx) => {
  console.error(`Unhandled error for ${ctx.updateType}:`, err);
  ctx.reply('⚠️ Произошла внутренняя ошибка. Пожалуйста, попробуйте еще раз.').catch(() => {});
});

bot.launch().then(() => {
  console.log('🚀 Local AI Telegram Agent is running!');
}).catch((err) => {
  console.error('Failed to launch bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
