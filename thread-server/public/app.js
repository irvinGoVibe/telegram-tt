import { unzip } from "/vendor/fflate.js";

const SETTINGS_KEY = "thread.preferences.v1";
const MODEL_KEY = "thread.r2-model.v1";
const ASSISTANT_WORKSPACES_KEY = "thread.assistant-workspaces.v1";
const DEFAULT_SETTINGS = { interfaceLanguage: "en", theme: "dark", responseLanguage: "auto" };

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

const settings = loadSettings();
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function resolvedTheme(theme = settings.theme) {
  return theme === "system" ? (systemTheme.matches ? "dark" : "light") : theme;
}

function applyTheme(theme = settings.theme) {
  document.documentElement.dataset.theme = resolvedTheme(theme);
  document.documentElement.style.colorScheme = resolvedTheme(theme);
}

applyTheme();

const RU = {
  "Telegram archive": "Архив Telegram",
  "Archive and filters": "Архив и фильтры",
  "Thread — home": "Thread — главная",
  "Collapse sidebar": "Свернуть боковую панель",
  "Import archive": "Импортировать архив",
  "Search messages": "Поиск сообщений",
  "Archive views": "Режимы архива",
  "All messages": "Все сообщения",
  "Links": "Ссылки",
  "Attachments": "Вложения",
  "Members": "Участники",
  "Available after import": "Появятся после импорта",
  "The archive stays on this Mac": "Архив остается на этом Mac",
  "Open settings": "Открыть настройки",
  "Settings": "Настройки",
  "English · Dark · Auto replies": "Русский · Темная · Автоответы",
  "Open filters": "Открыть фильтры",
  "Import a group export to get started": "Импортируйте экспорт группы, чтобы начать",
  "Jump to latest": "К последним",
  "Archive details": "Сведения об архиве",
  "Local archive": "Локальный архив",
  "Bring context": "Верните контекст",
  "back into view": "в поле зрения",
  "Import a Telegram": "Импортируйте",
  "ZIP or export folder": "ZIP или папку экспорта Telegram",
  ". Thread will rebuild the group, photos, links, and replies in one continuous timeline.": ". Thread восстановит группу, фотографии, ссылки и ответы в единой ленте.",
  "Choose archive": "Выбрать архив",
  "Open demo": "Открыть демо",
  "ZIP or folder imports keep photos beside their messages": "При импорте ZIP или папки фотографии сохраняются рядом с сообщениями",
  "Reset": "Сбросить",
  "No results": "Ничего не найдено",
  "Try another phrase or reset the filters.": "Попробуйте другую фразу или сбросьте фильтры.",
  "Jump to newer messages": "К новым сообщениям",
  "Archive researcher": "Исследователь архива",
  "Researcher": "Исследователь",
  "Checking Codex CLI": "Проверяем Codex CLI",
  "Clear conversation": "Очистить диалог",
  "Choose conversation": "Выбрать диалог",
  "New research": "Новое исследование",
  "Conversations": "Диалоги",
  "New chat": "Новый чат",
  "Open tasks": "Открыть задачи",
  "Back to chat": "Вернуться в чат",
  "Workspace folder": "Рабочая папка",
  "Tasks": "Задачи",
  "Tasks created from assistant answers": "Задачи, созданные из ответов помощника",
  "No tasks yet": "Задач пока нет",
  "Create one from any assistant answer.": "Создайте задачу из любого ответа помощника.",
  "Copy": "Копировать",
  "Download .md": "Скачать .md",
  "Create task": "Создать задачу",
  "Created from": "Создано из",
  "Open Telegram message": "Открыть сообщение в Telegram",
  "Codex reads alongside you": "Codex читает вместе с вами",
  "Ask the archive,": "Спросите архив,",
  "not your memory": "а не свою память",
  "Answers stay grounded in the group history. Every citation takes you straight to its source.": "Ответы опираются на историю группы. Каждая цитата ведет прямо к источнику.",
  "Key takeaways": "Главные выводы",
  "Topics and decisions": "Темы и решения",
  "Commitments": "Обязательства",
  "Deadlines and owners": "Сроки и ответственные",
  "Useful links": "Полезные ссылки",
  "Resources with context": "Ресурсы с контекстом",
  "Import an archive first…": "Сначала импортируйте архив…",
  "No context": "Нет контекста",
  "Send question": "Отправить вопрос",
  "Codex can make mistakes — verify the citations": "Codex может ошибаться — проверяйте цитаты",
  "Sections": "Разделы",
  "Archive": "Архив",
  "Telegram Desktop import": "Импорт из Telegram Desktop",
  "Add a group archive": "Добавить архив группы",
  "Close": "Закрыть",
  "Drop a ZIP or export folder": "Перетащите ZIP или папку экспорта",
  "It should contain result.json and the photos folder": "Внутри должны быть result.json и папка photos",
  "Choose folder": "Выбрать папку",
  "The archive and photos are processed locally": "Архив и фотографии обрабатываются локально",
  "How to export": "Как экспортировать",
  "Telegram Desktop →": "Telegram Desktop →",
  "→ Export chat history": "→ Экспорт истории чата",
  "Choose": "Выберите",
  "JSON": "JSON",
  "and include photos and the attachments you need.": "и включите фотографии и нужные вложения.",
  "Import the entire export folder or compress it into a": "Импортируйте всю папку экспорта или сначала сожмите ее в",
  "ZIP": "ZIP",
  "first.": ".",
  "Photo": "Фото",
  "Close photo": "Закрыть фото",
  "Download original": "Скачать оригинал",
  "Archive summary": "Сводка архива",
  "Data stays in this tab's memory and is cleared when you close it.": "Данные хранятся в памяти этой вкладки и удаляются после ее закрытия.",
  "Preferences": "Параметры",
  "Close settings": "Закрыть настройки",
  "Interface language": "Язык интерфейса",
  "Changes navigation, labels, and system messages.": "Меняет навигацию, подписи и системные сообщения.",
  "English": "English",
  "Русский": "Русский",
  "Theme": "Тема",
  "Use a fixed appearance or follow your Mac.": "Выберите постоянное оформление или используйте тему Mac.",
  "Dark": "Темная",
  "Light": "Светлая",
  "System": "Системная",
  "Assistant response language": "Язык ответов помощника",
  "This can differ from the language of the archive.": "Он может отличаться от языка архива.",
  "Auto": "Авто",
  "Preferences are saved in this browser.": "Настройки сохраняются в этом браузере.",
  "Cancel": "Отмена",
  "Save changes": "Сохранить",
  "You": "Вы",
  "Codex · archive grounded": "Codex · по материалам архива",
  "Stop response": "Остановить ответ",
  "Codex CLI ready": "Codex CLI готов",
  "Codex CLI not found": "Codex CLI не найден",
  "OpenAI API key required": "Требуется ключ OpenAI API",
  "R2 Copilot reads alongside you": "R2 Copilot читает вместе с вами",
  "AI can make mistakes — verify the citations": "AI может ошибаться — проверяйте цитаты",
  "Choose AI model": "Выбрать модель AI",
  "Loading models…": "Загружаем модели…",
  "Models unavailable": "Модели недоступны",
  "R2 Copilot API key required": "Требуется ключ R2 Copilot API",
  "Server unavailable": "Сервер недоступен",
  "Codex CLI is unavailable…": "Codex CLI недоступен…",
  "Ask about decisions, people, deadlines, or links…": "Спросите о решениях, людях, сроках или ссылках…",
};

function t(key) {
  return settings.interfaceLanguage === "ru" ? (RU[key] || key) : key;
}

const staticTextSources = new WeakMap();
const staticAttributeSources = new WeakMap();

function translateStaticInterface() {
  document.documentElement.lang = settings.interfaceLanguage;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!staticTextSources.has(node)) staticTextSources.set(node, node.nodeValue);
    const source = staticTextSources.get(node);
    const trimmed = source.trim();
    node.nodeValue = trimmed && settings.interfaceLanguage === "ru" && RU[trimmed]
      ? source.replace(trimmed, RU[trimmed])
      : source;
  }
  for (const element of document.querySelectorAll("[aria-label], [title], [placeholder]")) {
    if (!staticAttributeSources.has(element)) staticAttributeSources.set(element, new Map());
    const sources = staticAttributeSources.get(element);
    for (const attribute of ["aria-label", "title", "placeholder"]) {
      if (!element.hasAttribute(attribute)) continue;
      if (!sources.has(attribute)) sources.set(attribute, element.getAttribute(attribute));
      const source = sources.get(attribute);
      element.setAttribute(attribute, settings.interfaceLanguage === "ru" && RU[source] ? RU[source] : source);
    }
  }
}

translateStaticInterface();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const elements = {
  appShell: $("#appShell"),
  archiveMain: $("#archiveMain"),
  messageStage: $("#messageStage"),
  emptyArchive: $("#emptyArchive"),
  messagesView: $("#messagesView"),
  messagesList: $("#messagesList"),
  noResults: $("#noResults"),
  archiveName: $("#archiveName"),
  archiveMeta: $("#archiveMeta"),
  groupAvatar: $("#groupAvatar"),
  archiveSearch: $("#archiveSearch"),
  filterSummary: $("#filterSummary"),
  filterSummaryText: $("#filterSummaryText"),
  clearFiltersButton: $("#clearFiltersButton"),
  participantsList: $("#participantsList"),
  participantCount: $("#participantCount"),
  allCount: $("#allCount"),
  linksCount: $("#linksCount"),
  mediaCount: $("#mediaCount"),
  jumpTodayButton: $("#jumpTodayButton"),
  newerMessagesButton: $("#newerMessagesButton"),
  archiveInfoButton: $("#archiveInfoButton"),
  importDialog: $("#importDialog"),
  infoDialog: $("#infoDialog"),
  archiveInput: $("#archiveInput"),
  folderInput: $("#folderInput"),
  pickArchiveButton: $("#pickArchiveButton"),
  pickFolderButton: $("#pickFolderButton"),
  importStatus: $("#importStatus"),
  dropZone: $("#dropZone"),
  mediaDialog: $("#mediaDialog"),
  mediaViewerImage: $("#mediaViewerImage"),
  mediaViewerTitle: $("#mediaViewerTitle"),
  mediaViewerMeta: $("#mediaViewerMeta"),
  mediaViewerDownload: $("#mediaViewerDownload"),
  infoArchiveName: $("#infoArchiveName"),
  archiveStats: $("#archiveStats"),
  cliStatus: $("#cliStatus"),
  assistantScroll: $("#assistantScroll"),
  assistantWelcome: $("#assistantWelcome"),
  assistantThread: $("#assistantThread"),
  assistantForm: $("#assistantForm"),
  assistantInput: $("#assistantInput"),
  assistantComposerWrap: $("#assistantComposerWrap"),
  sendButton: $("#sendButton"),
  clearAssistantButton: $("#clearAssistantButton"),
  assistantChatButton: $("#assistantChatButton"),
  assistantChatTitle: $("#assistantChatTitle"),
  assistantChatPopover: $("#assistantChatPopover"),
  assistantChatList: $("#assistantChatList"),
  assistantNewChatButton: $("#assistantNewChatButton"),
  assistantTasksButton: $("#assistantTasksButton"),
  assistantTaskCount: $("#assistantTaskCount"),
  assistantTasksView: $("#assistantTasksView"),
  assistantTasksList: $("#assistantTasksList"),
  assistantTasksEmpty: $("#assistantTasksEmpty"),
  assistantTasksBackButton: $("#assistantTasksBackButton"),
  contextIndicator: $("#contextIndicator"),
  modelSelect: $("#modelSelect"),
  toastStack: $("#toastStack"),
  mobileMenuButton: $("#mobileMenuButton"),
  collapseRailButton: $("#collapseRailButton"),
  openSettingsButton: $("#openSettingsButton"),
  settingsDialog: $("#settingsDialog"),
  settingsForm: $("#settingsForm"),
  settingsSummary: $("#settingsSummary"),
};

function settingLabel(group, value) {
  const labels = {
    interfaceLanguage: { en: "English", ru: "Русский" },
    theme: { dark: t("Dark"), light: t("Light"), system: t("System") },
    responseLanguage: { auto: t("Auto"), en: "English", ru: "Русский" },
  };
  return labels[group]?.[value] || value;
}

function updateSettingsSummary() {
  elements.settingsSummary.textContent = [
    settingLabel("interfaceLanguage", settings.interfaceLanguage),
    settingLabel("theme", settings.theme),
    `${settingLabel("responseLanguage", settings.responseLanguage)} ${settings.interfaceLanguage === "ru" ? "ответы" : "replies"}`,
  ].join(" · ");
}

function updateLocalizedPrompts() {
  const prompts = settings.interfaceLanguage === "ru"
    ? [
        "Кратко изложи основные темы и решения.",
        "Найди все обязательства, сроки и ответственных.",
        "Собери полезные ссылки и объясни, зачем нужна каждая из них.",
      ]
    : [
        "Summarize the main topics and decisions.",
        "Find every commitment, deadline, and owner.",
        "Collect the useful links and explain why each one matters.",
      ];
  $$("#promptSuggestions button").forEach((button, index) => { button.dataset.prompt = prompts[index]; });
}

function rerenderAssistantThread() {
  elements.assistantThread.replaceChildren();
  const chat = activeAssistantChat();
  for (const message of chat?.messages || []) appendAssistantMessage(message);
  const hasMessages = Boolean(chat?.messages.length);
  elements.assistantWelcome.hidden = state.assistantView !== "chat" || hasMessages;
  elements.assistantThread.hidden = state.assistantView !== "chat";
  elements.assistantTasksView.hidden = state.assistantView !== "tasks";
  elements.assistantComposerWrap.hidden = state.assistantView !== "chat";
  elements.clearAssistantButton.disabled = !hasMessages;
  elements.assistantChatTitle.textContent = chat?.title || t("New research");
  elements.assistantTasksButton.classList.toggle("active", state.assistantView === "tasks");
  renderAssistantChatList();
  renderAssistantTasks();
}

function openSettings() {
  for (const [name, value] of Object.entries(settings)) {
    const input = elements.settingsForm.elements.namedItem(name);
    if (input && typeof input.value !== "undefined") input.value = value;
  }
  elements.settingsDialog.showModal();
}

function saveSettings() {
  const formData = new FormData(elements.settingsForm);
  const next = {
    interfaceLanguage: formData.get("interfaceLanguage") || DEFAULT_SETTINGS.interfaceLanguage,
    theme: formData.get("theme") || DEFAULT_SETTINGS.theme,
    responseLanguage: formData.get("responseLanguage") || DEFAULT_SETTINGS.responseLanguage,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  Object.assign(settings, next);
  applyTheme();
  translateStaticInterface();
  updateSettingsSummary();
  updateLocalizedPrompts();
  if (state.archive) {
    updateArchiveChrome();
    renderParticipants();
    renderMessages({ keepScroll: true });
  }
  rerenderAssistantThread();
  checkCliStatus();
  elements.settingsDialog.close();
  showToast(settings.interfaceLanguage === "ru" ? "Настройки сохранены" : "Settings saved");
}

updateSettingsSummary();
updateLocalizedPrompts();
systemTheme.addEventListener("change", () => {
  if (settings.theme === "system") applyTheme("system");
});

const AVATAR_COLORS = [
  "#4d8fbe",
  "#9a6687",
  "#5f9278",
  "#a87545",
  "#687fb3",
  "#996858",
  "#5b8c94",
  "#846fa5",
];

const MIME_BY_EXTENSION = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
  ["svg", "image/svg+xml"],
  ["heic", "image/heic"],
  ["avif", "image/avif"],
  ["mp4", "video/mp4"],
  ["mov", "video/quicktime"],
  ["webm", "video/webm"],
  ["m4v", "video/x-m4v"],
  ["pdf", "application/pdf"],
  ["zip", "application/zip"],
]);

const ARCHIVE_MEDIA_PATTERN = /\.(?:jpe?g|png|webp|gif|svg|heic|avif|mp4|mov|webm|m4v|mp3|m4a|ogg|wav|pdf|docx?|xlsx?|pptx?|txt|csv)$/iu;
const MAX_ZIP_BYTES = 700 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 1_200 * 1024 * 1024;

const state = {
  archive: null,
  filters: {
    search: "",
    view: "all",
    participant: "",
  },
  renderLimit: 800,
  cliReady: false,
  cliVersion: "",
  provider: "",
  models: [],
  selectedModel: localStorage.getItem(MODEL_KEY) || "",
  assistantWorkspaceKey: "",
  assistantWorkspace: { chats: [], activeChatId: "", tasks: [] },
  assistantView: "chat",
  requestController: null,
  loading: false,
};

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

function createLocalId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAssistantChat() {
  const now = new Date().toISOString();
  return {
    id: createLocalId("chat"),
    title: t("New research"),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function assistantArchiveKey(archive) {
  const first = archive?.messages?.[0];
  const last = archive?.messages?.at(-1);
  const seed = [
    archive?.name,
    archive?.type,
    archive?.messages?.length,
    first?.id,
    first?.fallbackDate,
    last?.id,
    last?.fallbackDate,
  ].join("|");
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `archive-${(hash >>> 0).toString(36)}`;
}

function normalizeAssistantWorkspace(raw) {
  const chats = Array.isArray(raw?.chats)
    ? raw.chats.slice(-24).map((chat) => ({
        id: cleanText(chat?.id) || createLocalId("chat"),
        title: cleanText(chat?.title) || t("New research"),
        createdAt: cleanText(chat?.createdAt) || new Date().toISOString(),
        updatedAt: cleanText(chat?.updatedAt) || new Date().toISOString(),
        messages: Array.isArray(chat?.messages)
          ? chat.messages.slice(-80).map((message) => ({
              id: cleanText(message?.id) || createLocalId("message"),
              role: message?.role === "assistant" ? "assistant" : "user",
              text: cleanText(message?.text),
              createdAt: cleanText(message?.createdAt) || new Date().toISOString(),
            })).filter((message) => message.text)
          : [],
      }))
    : [];
  if (!chats.length) chats.push(createAssistantChat());
  const chatIds = new Set(chats.map((chat) => chat.id));
  const tasks = Array.isArray(raw?.tasks)
    ? raw.tasks.slice(-200).map((task) => ({
        id: cleanText(task?.id) || createLocalId("task"),
        title: cleanText(task?.title) || t("Create task"),
        sourceChatId: cleanText(task?.sourceChatId),
        sourceMessageId: cleanText(task?.sourceMessageId),
        excerpt: cleanText(task?.excerpt),
        createdAt: cleanText(task?.createdAt) || new Date().toISOString(),
      })).filter((task) => chatIds.has(task.sourceChatId) && task.sourceMessageId)
    : [];
  const activeChatId = chats.some((chat) => chat.id === raw?.activeChatId)
    ? raw.activeChatId
    : chats.at(-1).id;
  return { chats, activeChatId, tasks };
}

function readAssistantWorkspaces() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ASSISTANT_WORKSPACES_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function persistAssistantWorkspace() {
  if (!state.assistantWorkspaceKey) return;
  const workspaces = readAssistantWorkspaces();
  workspaces[state.assistantWorkspaceKey] = state.assistantWorkspace;
  try {
    localStorage.setItem(ASSISTANT_WORKSPACES_KEY, JSON.stringify(workspaces));
  } catch {
    showToast(settings.interfaceLanguage === "ru" ? "Не удалось сохранить рабочее пространство" : "Could not save the workspace");
  }
}

function loadAssistantWorkspace(archive) {
  state.assistantWorkspaceKey = assistantArchiveKey(archive);
  state.assistantWorkspace = normalizeAssistantWorkspace(readAssistantWorkspaces()[state.assistantWorkspaceKey]);
  state.assistantView = "chat";
  elements.assistantChatButton.disabled = false;
  elements.assistantTasksButton.disabled = false;
  rerenderAssistantThread();
}

function activeAssistantChat() {
  return state.assistantWorkspace.chats.find((chat) => chat.id === state.assistantWorkspace.activeChatId)
    || state.assistantWorkspace.chats[0]
    || null;
}

function showAssistantView(view) {
  closeAssistantChatPopover();
  state.assistantView = view === "tasks" ? "tasks" : "chat";
  rerenderAssistantThread();
  if (state.assistantView === "chat") scrollAssistantToEnd();
  else elements.assistantScroll.scrollTop = 0;
}

function selectAssistantChat(chatId, messageId = "") {
  if (state.loading) return;
  const chat = state.assistantWorkspace.chats.find((candidate) => candidate.id === chatId);
  if (!chat) return;
  state.assistantWorkspace.activeChatId = chat.id;
  persistAssistantWorkspace();
  closeAssistantChatPopover();
  showAssistantView("chat");
  if (messageId) {
    requestAnimationFrame(() => {
      const message = elements.assistantThread.querySelector(`[data-assistant-message-id="${CSS.escape(messageId)}"]`);
      if (!message) return;
      message.scrollIntoView({ block: "center", behavior: "smooth" });
      message.classList.remove("source-highlight");
      requestAnimationFrame(() => message.classList.add("source-highlight"));
    });
  }
}

function startNewAssistantChat() {
  if (state.loading || !state.archive) return;
  const chat = createAssistantChat();
  state.assistantWorkspace.chats.push(chat);
  state.assistantWorkspace.activeChatId = chat.id;
  persistAssistantWorkspace();
  closeAssistantChatPopover();
  showAssistantView("chat");
  elements.assistantInput.focus();
}

function closeAssistantChatPopover() {
  elements.assistantChatPopover.hidden = true;
  elements.assistantChatButton.setAttribute("aria-expanded", "false");
}

function renderAssistantChatList() {
  const fragment = document.createDocumentFragment();
  for (const chat of [...state.assistantWorkspace.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const button = document.createElement("button");
    button.className = `assistant-chat-option${chat.id === state.assistantWorkspace.activeChatId ? " active" : ""}`;
    button.type = "button";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = chat.title;
    const meta = document.createElement("small");
    const replyCount = chat.messages.filter((message) => message.role === "assistant").length;
    meta.textContent = settings.interfaceLanguage === "ru"
      ? `${replyCount} ответов`
      : `${replyCount} ${replyCount === 1 ? "answer" : "answers"}`;
    copy.append(title, meta);
    const active = document.createElement("i");
    active.setAttribute("aria-hidden", "true");
    button.append(copy, active);
    button.addEventListener("click", () => selectAssistantChat(chat.id));
    fragment.append(button);
  }
  elements.assistantChatList.replaceChildren(fragment);
}

function taskTitleFromAnswer(text) {
  const lines = cleanText(text)
    .split("\n")
    .map((line) => line.replace(/^#{1,4}\s+|^[-*]\s+|^\d+[.)]\s+/g, "").replace(/\[#?\d+\]/g, "").replace(/[*_`]/g, "").trim())
    .filter(Boolean);
  const title = lines.find((line) => line.length >= 12) || lines[0] || t("Create task");
  return title.length > 88 ? `${title.slice(0, 85).trimEnd()}…` : title;
}

function createTaskFromAssistantMessage(message) {
  const chat = activeAssistantChat();
  if (!chat || message.role !== "assistant") return;
  const existing = state.assistantWorkspace.tasks.find((task) => task.sourceMessageId === message.id);
  if (existing) {
    showToast(settings.interfaceLanguage === "ru" ? "Задача из этого ответа уже создана" : "A task already exists for this answer");
    return;
  }
  state.assistantWorkspace.tasks.unshift({
    id: createLocalId("task"),
    title: taskTitleFromAnswer(message.text),
    sourceChatId: chat.id,
    sourceMessageId: message.id,
    excerpt: cleanText(message.text)
      .replace(/\[#?\d+\]/g, "")
      .replace(/[*_`#]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 180),
    createdAt: new Date().toISOString(),
  });
  persistAssistantWorkspace();
  renderAssistantTasks();
  showToast(settings.interfaceLanguage === "ru" ? "Задача создана" : "Task created");
}

function renderAssistantTasks() {
  const tasks = state.assistantWorkspace.tasks;
  const fragment = document.createDocumentFragment();
  for (const task of tasks) {
    const chat = state.assistantWorkspace.chats.find((candidate) => candidate.id === task.sourceChatId);
    const card = document.createElement("article");
    card.className = "assistant-task-card";
    const copy = document.createElement("div");
    copy.className = "assistant-task-copy";
    const title = document.createElement("strong");
    title.textContent = task.title;
    const excerpt = document.createElement("small");
    excerpt.textContent = task.excerpt;
    const source = document.createElement("button");
    source.className = "assistant-task-source";
    source.type = "button";
    source.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h10M5 18h7" /></svg>';
    source.append(document.createTextNode(`${t("Created from")}: ${chat?.title || t("New research")}`));
    source.addEventListener("click", () => selectAssistantChat(task.sourceChatId, task.sourceMessageId));
    copy.append(title, excerpt, source);
    card.append(copy);
    fragment.append(card);
  }
  elements.assistantTasksList.replaceChildren(fragment);
  elements.assistantTasksEmpty.hidden = tasks.length > 0;
  elements.assistantTaskCount.hidden = tasks.length === 0;
  elements.assistantTaskCount.textContent = String(tasks.length);
}

function initials(value, fallback = "?") {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] || "")
    .join("")
    .toLocaleUpperCase("en-US");
}

function colorFor(value) {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function safeUrl(value) {
  const trimmed = cleanText(value);
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, window.location.href);
    if (["http:", "https:", "mailto:", "tg:"].includes(url.protocol)) return trimmed;
  } catch {
    return "";
  }
  return "";
}

function normalizeTelegramUsername(value) {
  const username = cleanText(value).replace(/^@/, "");
  return /^[a-z][a-z0-9_]{4,31}$/i.test(username) ? username : "";
}

function normalizeTelegramChannelId(value) {
  const channelId = cleanText(value).replace(/^(?:channel|chat)/i, "");
  if (/^-100[1-9]\d*$/.test(channelId)) return channelId.slice(4);
  return /^[1-9]\d*$/.test(channelId) ? channelId : "";
}

function telegramMessageUrl(archive, messageId) {
  const normalizedMessageId = cleanText(messageId);
  if (!/^[1-9]\d*$/.test(normalizedMessageId)) return "";
  const type = cleanText(archive?.type).toLocaleLowerCase("en-US");
  const username = normalizeTelegramUsername(archive?.telegramUsername);
  if (username && (type === "public_supergroup" || type === "public_channel")) {
    return `https://t.me/${username}/${normalizedMessageId}`;
  }
  if (type !== "private_supergroup" && type !== "private_channel") return "";
  const channelId = normalizeTelegramChannelId(archive?.telegramChatId);
  return channelId ? `https://t.me/c/${channelId}/${normalizedMessageId}` : "";
}

function markdownWithTelegramLinks(markdown, archive) {
  return cleanText(markdown).replace(/\[#(\d+)\](?!\()/g, (citation, messageId) => {
    const url = telegramMessageUrl(archive, messageId);
    return url ? `${citation}(${url})` : citation;
  });
}

function normalizeArchivePath(value) {
  return cleanText(value)
    .replaceAll("\\", "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function extensionOf(value) {
  return normalizeArchivePath(value).split(".").pop()?.toLocaleLowerCase("en-US") || "";
}

function mimeForPath(value, fallback = "") {
  return cleanText(fallback) || MIME_BY_EXTENSION.get(extensionOf(value)) || "application/octet-stream";
}

function kindForMedia(value, mime = "") {
  const type = mimeForPath(value, mime);
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return "file";
}

function toDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw;
  const unix = Number(raw);
  if (/^\d{9,13}$/.test(String(raw)) && Number.isFinite(unix)) {
    const date = new Date(String(raw).length > 10 ? unix : unix * 1000);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const normalized = String(raw).replace(" ", "T");
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDay(date, fallback = "No date") {
  if (!date) return fallback;
  return new Intl.DateTimeFormat(settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date, fallback = "") {
  if (!date) return fallback;
  return new Intl.DateTimeFormat(settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCompactDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat(settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function dayKey(date, fallback = "unknown") {
  if (!date) return fallback;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function extractTelegramSegments(raw) {
  const preferred = Array.isArray(raw.text_entities) && raw.text_entities.length
    ? raw.text_entities
    : raw.text;
  const source = Array.isArray(preferred) ? preferred : [preferred ?? ""];
  const segments = [];

  for (const part of source) {
    if (typeof part === "string" || typeof part === "number") {
      if (String(part)) segments.push({ type: "plain", text: String(part), href: "" });
      continue;
    }
    if (!part || typeof part !== "object") continue;
    const text = String(part.text ?? "");
    if (!text) continue;
    const type = String(part.type || "plain");
    const href = safeUrl(part.href || (type === "link" || type === "email" ? text : ""));
    segments.push({ type, text, href });
  }

  return segments;
}

function describeMedia(raw) {
  if (raw.photo) {
    const mediaPath = normalizeArchivePath(raw.photo);
    return {
      label: `Photo · ${mediaPath.split("/").pop()}`,
      path: mediaPath,
      kind: "image",
      mime: mimeForPath(mediaPath, "image/jpeg"),
    };
  }
  if (raw.file) {
    const mediaPath = normalizeArchivePath(raw.file);
    const mime = mimeForPath(mediaPath, raw.mime_type);
    const kind = raw.media_type === "video_file" ? "video" : kindForMedia(mediaPath, mime);
    const labelType = raw.sticker_emoji ? `Sticker ${raw.sticker_emoji}` : kind === "video" ? "Video" : kind === "image" ? "Image" : "File";
    return { label: `${labelType} · ${mediaPath.split("/").pop()}`, path: mediaPath, kind, mime };
  }
  if (raw.sticker_emoji) return { label: `Sticker ${raw.sticker_emoji}`, path: "", kind: "file", mime: "" };
  if (raw.poll?.question) return { label: `Poll · ${raw.poll.question}`, path: "", kind: "file", mime: "" };
  if (raw.location_information) return { label: "Location", path: "", kind: "file", mime: "" };
  if (raw.contact_information) return { label: "Contact", path: "", kind: "file", mime: "" };
  return { label: "", path: "", kind: "", mime: "" };
}

function normalizeTelegramMessage(raw, index) {
  const segments = extractTelegramSegments(raw);
  const text = cleanText(segments.map((segment) => segment.text).join(""));
  const date = toDate(raw.date_unixtime || raw.date);
  const fallbackDate = cleanText(raw.date || "");
  const id = String(raw.id ?? index + 1);
  const service = raw.type === "service";
  const author = cleanText(raw.from || raw.actor || raw.saved_from || (service ? "Telegram" : "Unknown member"));
  const links = Array.from(
    new Set(
      segments
        .map((segment) => segment.href || (/(?:https?:\/\/|tg:\/\/)/i.test(segment.text) ? safeUrl(segment.text) : ""))
        .filter(Boolean),
    ),
  );
  const mediaInfo = describeMedia(raw);
  let serviceText = text;
  if (service && !serviceText) {
    const action = cleanText(raw.action || "system event").replaceAll("_", " ");
    serviceText = `${author}: ${action}`;
  }

  return {
    id,
    type: service ? "service" : "message",
    author,
    fromId: String(raw.from_id || raw.actor_id || author),
    date,
    fallbackDate,
    timestamp: date?.getTime() || index,
    text: serviceText,
    segments: service ? [{ type: "plain", text: serviceText, href: "" }] : segments,
    links,
    media: mediaInfo.label,
    mediaPath: mediaInfo.path,
    mediaKind: mediaInfo.kind,
    mediaMime: mediaInfo.mime,
    mediaUrl: "",
    replyTo: raw.reply_to_message_id != null ? String(raw.reply_to_message_id) : "",
    forwardedFrom: cleanText(raw.forwarded_from || ""),
    index,
  };
}

function resolveTelegramChat(data) {
  if (Array.isArray(data?.messages)) return { chat: data, discoveredCount: 1 };
  const chats = Array.isArray(data?.chats?.list)
    ? data.chats.list.filter((chat) => Array.isArray(chat?.messages) && chat.messages.length)
    : [];
  if (!chats.length) throw new Error("No Telegram messages array was found in this JSON file.");
  chats.sort((a, b) => b.messages.length - a.messages.length);
  return { chat: chats[0], discoveredCount: chats.length };
}

function parseTelegramJson(content, fileName) {
  let data;
  try {
    data = JSON.parse(content.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Could not read the JSON file. Make sure it is a Telegram export.");
  }

  const { chat, discoveredCount } = resolveTelegramChat(data);
  const messages = chat.messages.map(normalizeTelegramMessage).filter((message) => message.text || message.media);
  if (!messages.length) throw new Error("This archive has no messages to display.");
  messages.sort((a, b) => a.timestamp - b.timestamp || a.index - b.index);

  return makeArchive({
    name: cleanText(chat.name || data.name || fileName.replace(/\.[^.]+$/, "") || "Telegram archive"),
    type: cleanText(chat.type || data.type || "private_group"),
    source: "JSON",
    messages,
    discoveredCount,
    telegramChatId: cleanText(chat.id),
    telegramUsername: cleanText(chat.username || chat.user_name),
  });
}

function parseTelegramHtml(content, fileName) {
  const documentNode = new DOMParser().parseFromString(content, "text/html");
  const blocks = $$(`.message`, documentNode);
  const messages = [];
  let lastAuthor = "Unknown member";

  blocks.forEach((block, index) => {
    const id = (block.id || `message${index + 1}`).replace(/^message/, "");
    const service = block.classList.contains("service");
    const fromNode = $(".from_name", block);
    if (fromNode?.textContent?.trim()) lastAuthor = fromNode.textContent.trim();
    const textNode = $(".text", block) || $(".body.details", block);
    const text = cleanText(textNode?.textContent || "");
    const dateNode = $(".date.details", block) || $(".date", block);
    const rawDate = dateNode?.getAttribute("title") || dateNode?.textContent || "";
    const date = toDate(rawDate.replace(/(\d{2})\.(\d{2})\.(\d{4})/, "$3-$2-$1"));
    const segments = [];

    if (textNode) {
      for (const node of textNode.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          segments.push({ type: "plain", text: node.textContent || "", href: "" });
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "A") {
          segments.push({ type: "link", text: node.textContent || "", href: safeUrl(node.getAttribute("href")) });
        } else {
          segments.push({ type: "plain", text: node.textContent || "", href: "" });
        }
      }
    }

    const links = $$(`a[href]`, textNode || block)
      .map((link) => safeUrl(link.getAttribute("href")))
      .filter(Boolean);
    const replyLink = $(".reply_to.details a", block)?.getAttribute("href") || "";
    const replyTo = replyLink.match(/message(\d+)/)?.[1] || "";
    const mediaNode = $("a.photo_wrap[href], a.video_file_wrap[href], .media_wrap a[href], a.media_wrap[href]", block);
    const mediaPath = normalizeArchivePath(mediaNode?.getAttribute("href") || "");
    const mediaKind = mediaNode?.classList.contains("video_file_wrap") ? "video" : kindForMedia(mediaPath);
    const media = mediaPath
      ? `${mediaKind === "image" ? "Photo" : mediaKind === "video" ? "Video" : "File"} · ${mediaPath.split("/").pop()}`
      : "";

    if (text || media) {
      messages.push({
        id,
        type: service ? "service" : "message",
        author: service ? "Telegram" : lastAuthor,
        fromId: service ? "service" : lastAuthor,
        date,
        fallbackDate: cleanText(rawDate),
        timestamp: date?.getTime() || index,
        text,
        segments: segments.length ? segments : [{ type: "plain", text, href: "" }],
        links: Array.from(new Set(links)),
        media,
        mediaPath,
        mediaKind,
        mediaMime: mimeForPath(mediaPath),
        mediaUrl: "",
        replyTo,
        forwardedFrom: "",
        index,
      });
    }
  });

  if (!messages.length) throw new Error("No Telegram messages were found in this HTML file.");
  const title = cleanText($(".page_header .text.bold", documentNode)?.textContent || documentNode.title || fileName.replace(/\.[^.]+$/, ""));
  return makeArchive({ name: title || "Telegram archive", type: "group", source: "HTML", messages, discoveredCount: 1 });
}

function makeArchive({ name, type, source, messages, discoveredCount = 1, telegramChatId = "", telegramUsername = "" }) {
  const participantMap = new Map();
  let linkCount = 0;
  let mediaCount = 0;

  for (const [index, message] of messages.entries()) {
    message.index = index;
    linkCount += message.links.length;
    if (message.media) mediaCount += 1;
    if (message.type === "service") continue;
    const current = participantMap.get(message.author) || { name: message.author, count: 0, color: colorFor(message.fromId) };
    current.count += 1;
    participantMap.set(message.author, current);
  }

  const participants = Array.from(participantMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"));
  const datedMessages = messages.filter((message) => message.date);
  return {
    name,
    type,
    source,
    messages,
    participants,
    participantMap,
    linkCount,
    mediaCount,
    resolvedMediaCount: 0,
    objectUrls: [],
    discoveredCount,
    telegramChatId,
    telegramUsername,
    firstDate: datedMessages[0]?.date || null,
    lastDate: datedMessages.at(-1)?.date || null,
  };
}

function attachMediaEntries(archive, entries) {
  const entryIndex = new Map();
  for (const entry of entries) {
    const normalized = normalizeArchivePath(entry.path);
    if (!normalized || !entry.blob) continue;
    const parts = normalized.split("/");
    for (let index = 0; index < parts.length; index += 1) {
      const alias = parts.slice(index).join("/");
      if (alias && !entryIndex.has(alias)) entryIndex.set(alias, entry);
    }
  }

  let resolved = 0;
  for (const message of archive.messages) {
    if (!message.mediaPath) continue;
    const normalized = normalizeArchivePath(message.mediaPath);
    const entry = entryIndex.get(normalized);
    if (!entry) continue;
    const mime = mimeForPath(entry.path, entry.blob.type || message.mediaMime);
    const blob = entry.blob.type === mime ? entry.blob : new Blob([entry.blob], { type: mime });
    const url = URL.createObjectURL(blob);
    message.mediaUrl = url;
    message.mediaMime = mime;
    message.mediaKind = kindForMedia(entry.path, mime);
    message.mediaOriginalName = normalizeArchivePath(entry.path).split("/").pop();
    archive.objectUrls.push(url);
    resolved += 1;
  }
  archive.resolvedMediaCount = resolved;
  return archive;
}

function revokeArchiveMedia(archive) {
  for (const url of archive?.objectUrls || []) URL.revokeObjectURL(url);
  if (archive) archive.objectUrls = [];
}

function getDemoArchive() {
  const rawMessages = [
    { id: 81, date: "2026-05-12T09:14:00", from: "Maya L.", from_id: "user101", text: "Team, locking this in: the closed beta launches on May 20. We will collect onboarding feedback by Friday." },
    { id: 82, date: "2026-05-12T09:16:00", from: "Dennis", from_id: "user202", text: ["Updated designs: ", { type: "link", text: "https://www.figma.com/community", href: "https://www.figma.com/community" }] },
    { id: 83, date: "2026-05-12T09:19:00", from: "Alina", from_id: "user303", reply_to_message_id: 82, text: "Reviewed. On mobile, I would simplify step two and keep a single primary CTA." },
    { id: 84, date: "2026-05-12T09:23:00", from: "Maya L.", from_id: "user101", text: "Agreed. Alina owns the onboarding changes; Dennis owns analytics events. Deadline for both: May 16, 6 PM." },
    { id: 85, date: "2026-05-12T12:40:00", from: "Roman", from_id: "user404", text: ["Event schema and naming: ", { type: "link", text: "https://posthog.com/docs/product-analytics", href: "https://posthog.com/docs/product-analytics" }] },
    { id: 86, date: "2026-05-13T10:02:00", from: "Dennis", from_id: "user202", reply_to_message_id: 84, text: "Events are live on staging: signup_started, signup_completed, invite_sent. Naming needs a final check." },
    { id: 87, date: "2026-05-13T10:11:00", from: "Maya L.", from_id: "user101", text: "Names look good. Add workspace_created as well — that is our activation moment." },
    { id: 88, date: "2026-05-13T15:46:00", from: "Alina", from_id: "user303", text: "Mobile onboarding is ready. I removed the extra screen and kept one CTA plus an example hint." },
    { id: 89, date: "2026-05-14T09:08:00", from: "Roman", from_id: "user404", text: ["Pre-beta checklist: ", { type: "link", text: "https://github.com/features/issues", href: "https://github.com/features/issues" }] },
    { id: 90, date: "2026-05-14T09:13:00", from: "Maya L.", from_id: "user101", reply_to_message_id: 89, text: "Owners added. The go/no-go call is May 19 at 11 AM." },
    { id: 91, date: "2026-05-16T17:42:00", from: "Dennis", from_id: "user202", text: "Analytics is ready and the events were verified in PostHog. No discrepancies." },
    { id: 92, date: "2026-05-16T17:58:00", from: "Alina", from_id: "user303", text: "Changes are deployed. We can invite the first ten users." },
  ];
  const messages = rawMessages.map(normalizeTelegramMessage);
  return makeArchive({ name: "Product team · closed beta", type: "private_group", source: "Demo", messages });
}

function pluralMessages(count) {
  const locale = settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US";
  if (settings.interfaceLanguage === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word = mod10 === 1 && mod100 !== 11 ? "сообщение" : mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? "сообщения" : "сообщений";
    return `${count.toLocaleString(locale)} ${word}`;
  }
  return `${count.toLocaleString(locale)} ${count === 1 ? "message" : "messages"}`;
}

function appendLinkifiedText(container, value) {
  const text = String(value || "");
  const pattern = /((?:https?:\/\/|tg:\/\/)[^\s<>()]+[^\s<>().,!?;:'"\]])/giu;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    const href = safeUrl(match[0]);
    if (href) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[0];
      container.append(anchor);
    } else {
      container.append(document.createTextNode(match[0]));
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function renderMessageText(container, message) {
  const segments = message.segments?.length ? message.segments : [{ type: "plain", text: message.text, href: "" }];
  for (const segment of segments) {
    const href = safeUrl(segment.href);
    if (href) {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = segment.text;
      container.append(anchor);
    } else {
      appendLinkifiedText(container, segment.text);
    }
  }
}

function makeMediaChip(message) {
  const chip = document.createElement(message.mediaUrl ? "a" : "span");
  chip.className = `media-chip${message.mediaUrl ? " media-download-chip" : ""}`;
  chip.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12 5-5a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l7-7"/></svg>';
  if (message.mediaUrl) {
    chip.href = message.mediaUrl;
    chip.download = message.mediaOriginalName || message.mediaPath.split("/").pop() || "telegram-file";
  }
  const mediaText = document.createElement("span");
  mediaText.textContent = message.media;
  chip.append(mediaText);
  return chip;
}

function renderMessageMedia(container, message) {
  if (!message.media) return;
  if (message.mediaUrl && message.mediaKind === "image") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "message-photo";
    button.setAttribute("aria-label", settings.interfaceLanguage === "ru" ? `Открыть фото из сообщения #${message.id}` : `Open photo from message #${message.id}`);
    const image = document.createElement("img");
    image.src = message.mediaUrl;
    image.alt = message.text ? `Photo: ${message.text.slice(0, 90)}` : `Photo from ${message.author}`;
    image.loading = "lazy";
    image.decoding = "async";
    const meta = document.createElement("span");
    meta.className = "message-photo-meta";
    meta.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5"/></svg>';
    const metaText = document.createElement("span");
    metaText.textContent = settings.interfaceLanguage === "ru" ? "Открыть" : "Open";
    meta.append(metaText);
    button.append(image, meta);
    button.addEventListener("click", () => openMediaViewer(message));
    image.addEventListener("error", () => button.replaceWith(makeMediaChip(message)), { once: true });
    container.append(button);
    return;
  }
  if (message.mediaUrl && message.mediaKind === "video") {
    const video = document.createElement("video");
    video.className = "message-video";
    video.src = message.mediaUrl;
    video.controls = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", message.media);
    container.append(video);
    return;
  }
  container.append(makeMediaChip(message));
}

function getFilteredMessages() {
  if (!state.archive) return [];
  const query = state.filters.search.toLocaleLowerCase("en-US").trim();
  return state.archive.messages.filter((message) => {
    if (state.filters.view === "links" && !message.links.length) return false;
    if (state.filters.view === "media" && !message.media) return false;
    if (state.filters.participant && message.author !== state.filters.participant) return false;
    if (query) {
      const haystack = `${message.author}\n${message.text}\n${message.links.join("\n")}\n${message.media}`.toLocaleLowerCase("en-US");
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderMessages({ keepScroll = false } = {}) {
  if (!state.archive) return;
  const previousHeight = elements.messageStage.scrollHeight;
  const previousTop = elements.messageStage.scrollTop;
  const filtered = getFilteredMessages();
  const visible = filtered.slice(-state.renderLimit);
  const fragment = document.createDocumentFragment();
  const messageById = new Map(state.archive.messages.map((message) => [message.id, message]));
  let previousMessage = null;
  let previousDay = "";

  if (filtered.length > visible.length) {
    const loadOlder = document.createElement("button");
    loadOlder.type = "button";
    loadOlder.className = "secondary-button load-older-button";
    const olderCount = Math.min(800, filtered.length - visible.length).toLocaleString(settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US");
    loadOlder.textContent = settings.interfaceLanguage === "ru" ? `Показать предыдущие сообщения: ${olderCount}` : `Show ${olderCount} earlier messages`;
    loadOlder.addEventListener("click", () => {
      state.renderLimit += 800;
      renderMessages({ keepScroll: true });
    });
    fragment.append(loadOlder);
  }

  for (const message of visible) {
    const currentDay = dayKey(message.date, message.fallbackDate.slice(0, 10) || "unknown");
    if (currentDay !== previousDay) {
      const divider = document.createElement("div");
      divider.className = "date-divider";
      divider.textContent = formatDay(message.date, message.fallbackDate || (settings.interfaceLanguage === "ru" ? "Без даты" : "No date"));
      fragment.append(divider);
      previousDay = currentDay;
      previousMessage = null;
    }

    if (message.type === "service") {
      const service = document.createElement("article");
      service.className = "message-row service";
      service.dataset.messageId = message.id;
      service.id = `message-${CSS.escape(message.id)}`;
      service.textContent = message.text;
      fragment.append(service);
      previousMessage = null;
      continue;
    }

    const grouped = previousMessage
      && previousMessage.author === message.author
      && message.timestamp - previousMessage.timestamp < 5 * 60 * 1000;
    const row = document.createElement("article");
    row.className = "message-row";
    row.dataset.messageId = message.id;
    row.id = `message-${CSS.escape(message.id)}`;
    row.style.setProperty("--avatar-color", state.archive.participantMap.get(message.author)?.color || colorFor(message.fromId));

    const avatar = document.createElement("span");
    avatar.className = `message-avatar${grouped ? " ghost" : ""}`;
    avatar.textContent = initials(message.author);
    avatar.setAttribute("aria-hidden", "true");
    row.append(avatar);

    const body = document.createElement("div");
    body.className = "message-body";
    const byline = document.createElement("div");
    byline.className = "message-byline";
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = grouped ? "" : message.author;
    const time = document.createElement("time");
    time.className = "message-time";
    time.dateTime = message.date?.toISOString() || "";
    time.textContent = formatTime(message.date, message.fallbackDate.split(" ").at(-1) || "");
    byline.append(author, time);
    body.append(byline);

    if (message.replyTo) {
      const target = messageById.get(message.replyTo);
      const reply = document.createElement("button");
      reply.type = "button";
      reply.className = "reply-preview";
      const replyAuthor = document.createElement("strong");
      replyAuthor.textContent = target?.author || (settings.interfaceLanguage === "ru" ? `Сообщение #${message.replyTo}` : `Message #${message.replyTo}`);
      const replyText = document.createElement("span");
      replyText.textContent = target?.text?.slice(0, 110) || (settings.interfaceLanguage === "ru" ? "Перейти к исходному сообщению" : "Jump to the original message");
      reply.append(replyAuthor, replyText);
      reply.addEventListener("click", () => jumpToMessage(message.replyTo));
      body.append(reply);
    }

    const text = document.createElement("div");
    text.className = "message-text";
    renderMessageText(text, message);
    body.append(text);

    renderMessageMedia(body, message);

    row.append(body);
    const ledgerId = document.createElement("span");
    ledgerId.className = "message-ledger-id";
    ledgerId.textContent = message.id;
    ledgerId.title = settings.interfaceLanguage === "ru" ? `Номер сообщения #${message.id}` : `Message number #${message.id}`;
    row.append(ledgerId);
    fragment.append(row);
    previousMessage = message;
  }

  elements.messagesList.replaceChildren(fragment);
  elements.noResults.hidden = filtered.length !== 0;
  elements.messagesList.hidden = filtered.length === 0;
  updateFilterSummary(filtered.length);

  requestAnimationFrame(() => {
    if (keepScroll) {
      elements.messageStage.scrollTop = previousTop + (elements.messageStage.scrollHeight - previousHeight);
    }
  });
}

function updateFilterSummary(resultCount) {
  const labels = [];
  if (state.filters.view === "links") labels.push(settings.interfaceLanguage === "ru" ? "только ссылки" : "links only");
  if (state.filters.view === "media") labels.push(settings.interfaceLanguage === "ru" ? "только вложения" : "attachments only");
  if (state.filters.participant) labels.push(state.filters.participant);
  if (state.filters.search) labels.push(`«${state.filters.search}»`);
  elements.filterSummary.hidden = !labels.length;
  elements.filterSummaryText.textContent = labels.length
    ? `${pluralMessages(resultCount)} · ${labels.join(" · ")}`
    : "";
}

function renderParticipants() {
  if (!state.archive) return;
  const fragment = document.createDocumentFragment();
  for (const participant of state.archive.participants) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `participant-item${state.filters.participant === participant.name ? " active" : ""}`;
    button.style.setProperty("--avatar-color", participant.color);
    button.setAttribute("aria-pressed", state.filters.participant === participant.name ? "true" : "false");
    const avatar = document.createElement("span");
    avatar.className = "participant-avatar";
    avatar.textContent = initials(participant.name);
    const name = document.createElement("span");
    name.textContent = participant.name;
    const count = document.createElement("small");
    count.textContent = participant.count.toLocaleString("en-US");
    button.append(avatar, name, count);
    button.addEventListener("click", () => {
      state.filters.participant = state.filters.participant === participant.name ? "" : participant.name;
      state.renderLimit = 800;
      renderParticipants();
      renderMessages();
      closeMobileRail();
    });
    fragment.append(button);
  }
  elements.participantsList.replaceChildren(fragment);
}

function updateArchiveChrome() {
  const { archive } = state;
  if (!archive) return;
  elements.archiveName.textContent = archive.name;
  const memberWord = settings.interfaceLanguage === "ru" ? "участников" : "members";
  elements.archiveMeta.textContent = `${pluralMessages(archive.messages.length)} · ${archive.participants.length.toLocaleString(settings.interfaceLanguage === "ru" ? "ru-RU" : "en-US")} ${memberWord} · ${formatCompactDate(archive.firstDate)} — ${formatCompactDate(archive.lastDate)}`;
  elements.groupAvatar.textContent = initials(archive.name, "TG");
  elements.archiveSearch.disabled = false;
  elements.archiveInfoButton.disabled = false;
  elements.jumpTodayButton.hidden = false;
  elements.allCount.textContent = archive.messages.length.toLocaleString("en-US");
  elements.linksCount.textContent = archive.linkCount.toLocaleString("en-US");
  elements.mediaCount.textContent = archive.mediaCount.toLocaleString("en-US");
  elements.participantCount.textContent = archive.participants.length.toLocaleString("en-US");
  $$('[data-view="links"], [data-view="media"]').forEach((button) => { button.disabled = false; });
  elements.contextIndicator.lastChild.textContent = settings.interfaceLanguage === "ru"
    ? ` В контексте: ${pluralMessages(archive.messages.length)}`
    : ` ${pluralMessages(archive.messages.length)} in context`;
  updateAssistantAvailability();
}

function loadArchive(archive, { demo = false } = {}) {
  revokeArchiveMedia(state.archive);
  if (elements.mediaDialog.open) elements.mediaDialog.close();
  state.archive = archive;
  state.filters = { search: "", view: "all", participant: "" };
  state.renderLimit = 800;
  loadAssistantWorkspace(archive);
  elements.archiveSearch.value = "";
  elements.emptyArchive.hidden = true;
  elements.messagesView.hidden = false;
  updateArchiveChrome();
  renderParticipants();
  renderMessages();
  setActiveView("all");
  if (elements.importDialog.open) elements.importDialog.close();
  requestAnimationFrame(() => {
    elements.messageStage.scrollTop = elements.messageStage.scrollHeight;
  });
  if (archive.discoveredCount > 1) {
    showToast(`${archive.discoveredCount} chats found in the full export. Opened the largest: “${archive.name}”.`);
  } else {
    const mediaNote = archive.resolvedMediaCount
      ? ` · media available: ${archive.resolvedMediaCount.toLocaleString("en-US")}`
      : "";
    showToast(demo ? "Demo archive opened" : `Archive “${archive.name}” imported${mediaNote}`);
  }
}

function setImporting(importing, status = "It should contain result.json and the photos folder") {
  elements.dropZone.classList.toggle("importing", importing);
  elements.pickArchiveButton.disabled = importing;
  elements.pickFolderButton.disabled = importing;
  elements.importStatus.textContent = status;
}

function findManifestEntry(entries) {
  const candidates = entries.filter((entry) => /(?:^|\/)(?:result\.json|messages\.html)$/iu.test(normalizeArchivePath(entry.path)));
  candidates.sort((a, b) => {
    const aJson = /result\.json$/iu.test(a.path) ? 0 : 1;
    const bJson = /result\.json$/iu.test(b.path) ? 0 : 1;
    return aJson - bJson || normalizeArchivePath(a.path).split("/").length - normalizeArchivePath(b.path).split("/").length;
  });
  return candidates[0] || null;
}

async function importEntries(entries, source = "Folder") {
  const manifest = findManifestEntry(entries);
  if (!manifest) throw new Error("No result.json or messages.html file was found in this archive.");
  setImporting(true, "Reading messages and matching photos…");
  const content = await manifest.blob.text();
  const fileName = normalizeArchivePath(manifest.path).split("/").pop();
  const archive = /\.html$/iu.test(fileName) || /^\s*<!doctype html/iu.test(content)
    ? parseTelegramHtml(content, fileName)
    : parseTelegramJson(content, fileName);
  archive.source = source;
  attachMediaEntries(archive, entries);
  loadArchive(archive);
}

function unzipFile(file) {
  return new Promise(async (resolve, reject) => {
    try {
      if (file.size > MAX_ZIP_BYTES) {
        throw new Error("This ZIP is larger than 700 MB. Choose the export folder to avoid unpacking it into memory.");
      }
      setImporting(true, "Unpacking the ZIP locally in your browser…");
      const input = new Uint8Array(await file.arrayBuffer());
      let acceptedBytes = 0;
      let skipped = 0;
      unzip(input, {
        filter(info) {
          const name = normalizeArchivePath(info.name);
          const manifest = /(?:^|\/)(?:result\.json|messages\.html)$/iu.test(name);
          const supported = manifest || ARCHIVE_MEDIA_PATTERN.test(name);
          if (!supported || info.originalSize > 250 * 1024 * 1024 || acceptedBytes + info.originalSize > MAX_UNPACKED_BYTES) {
            if (supported) skipped += 1;
            return false;
          }
          acceptedBytes += info.originalSize;
          return true;
        },
      }, (error, files) => {
        if (error) {
          reject(new Error(`Could not unpack the ZIP: ${error.message}`));
          return;
        }
        const entries = Object.entries(files).map(([entryPath, bytes]) => ({
          path: entryPath,
          blob: new Blob([bytes], { type: mimeForPath(entryPath) }),
        }));
        resolve({ entries, skipped });
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function importSelection(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  try {
    const zipFile = files.length === 1 && extensionOf(files[0].name) === "zip" ? files[0] : null;
    if (zipFile) {
      const { entries, skipped } = await unzipFile(zipFile);
      await importEntries(entries, "ZIP");
      if (skipped) showToast(`Skipped oversized attachments: ${skipped}`, "error");
      return;
    }
    setImporting(true, files.length > 1 ? `Scanning ${files.length.toLocaleString("en-US")} files…` : "Reading the Telegram export…");
    const entries = files.map((file) => ({
      path: file.webkitRelativePath || file.name,
      blob: file,
    }));
    await importEntries(entries, files.some((file) => file.webkitRelativePath) ? "Folder" : "File");
  } catch (error) {
    showToast(error.message || "Could not import this archive.", "error");
  } finally {
    setImporting(false);
    elements.archiveInput.value = "";
    elements.folderInput.value = "";
  }
}

function setActiveView(view) {
  state.filters.view = view;
  state.renderLimit = 800;
  $$('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (state.archive) renderMessages();
}

function resetFilters() {
  state.filters = { search: "", view: "all", participant: "" };
  state.renderLimit = 800;
  elements.archiveSearch.value = "";
  setActiveView("all");
  renderParticipants();
}

function jumpToMessage(id) {
  if (!state.archive) return;
  const index = state.archive.messages.findIndex((message) => message.id === String(id));
  if (index < 0) {
    showToast(`Message #${id} was not found in this archive.`, "error");
    return;
  }

  state.filters = { search: "", view: "all", participant: "" };
  elements.archiveSearch.value = "";
  state.renderLimit = Math.max(800, state.archive.messages.length - index + 40);
  $$('[data-view]').forEach((button) => {
    const active = button.dataset.view === "all";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  renderParticipants();
  renderMessages();
  switchMobileView("archive");

  requestAnimationFrame(() => {
    const target = document.getElementById(`message-${CSS.escape(String(id))}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("cited");
    window.setTimeout(() => target.classList.remove("cited"), 3200);
  });
}

function showArchiveInfo() {
  if (!state.archive) return;
  const stats = [
    ["Messages", state.archive.messages.length.toLocaleString("en-US")],
    ["Members", state.archive.participants.length.toLocaleString("en-US")],
    ["Links", state.archive.linkCount.toLocaleString("en-US")],
    ["Media available", `${state.archive.resolvedMediaCount.toLocaleString("en-US")} / ${state.archive.mediaCount.toLocaleString("en-US")}`],
    ["Source", state.archive.source],
    ["Date range", `${formatCompactDate(state.archive.firstDate)} — ${formatCompactDate(state.archive.lastDate)}`],
  ];
  elements.infoArchiveName.textContent = state.archive.name;
  const fragment = document.createDocumentFragment();
  for (const [label, value] of stats) {
    const item = document.createElement("div");
    item.className = "archive-stat";
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    item.append(small, strong);
    fragment.append(item);
  }
  elements.archiveStats.replaceChildren(fragment);
  elements.infoDialog.showModal();
}

function openMediaViewer(message) {
  if (!message.mediaUrl || message.mediaKind !== "image") return;
  elements.mediaViewerImage.src = message.mediaUrl;
  elements.mediaViewerImage.alt = message.text ? `Photo: ${message.text.slice(0, 120)}` : `Photo from ${message.author}`;
  elements.mediaViewerTitle.textContent = message.mediaOriginalName || message.mediaPath.split("/").pop() || "Photo";
  elements.mediaViewerMeta.textContent = `${message.author} · ${formatDay(message.date, message.fallbackDate)} · #${message.id}`;
  elements.mediaViewerDownload.href = message.mediaUrl;
  elements.mediaViewerDownload.download = message.mediaOriginalName || "telegram-photo";
  elements.mediaDialog.showModal();
}

function inlineMarkdown(container, text) {
  const pattern = /(\[#([^\]]+)\]|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|(https?:\/\/[^\s<]+))/giu;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[2]) {
      const telegramUrl = telegramMessageUrl(state.archive, match[2]);
      if (telegramUrl) {
        const anchor = document.createElement("a");
        anchor.className = "citation-button telegram-citation";
        anchor.href = telegramUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = `#${match[2]}`;
        anchor.title = t("Open Telegram message");
        container.append(anchor);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "citation-button";
        button.textContent = `#${match[2]}`;
        button.addEventListener("click", () => jumpToMessage(match[2]));
        container.append(button);
      }
    } else if (match[3] && match[4]) {
      const anchor = document.createElement("a");
      anchor.href = safeUrl(match[4]);
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[3];
      container.append(anchor);
    } else if (match[5]) {
      const strong = document.createElement("strong");
      strong.textContent = match[5];
      container.append(strong);
    } else if (match[6]) {
      const code = document.createElement("code");
      code.textContent = match[6];
      container.append(code);
    } else if (match[7]) {
      const anchor = document.createElement("a");
      anchor.href = safeUrl(match[7].replace(/[.,;!?]+$/, ""));
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = match[7];
      container.append(anchor);
    } else {
      container.append(document.createTextNode(match[0]));
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function renderMarkdown(container, markdown) {
  const lines = cleanText(markdown).split("\n");
  let list = null;
  let listType = "";

  const closeList = () => {
    list = null;
    listType = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)/);
    const ordered = line.match(/^\d+[.)]\s+(.+)/);
    if (unordered || ordered) {
      const desiredType = unordered ? "ul" : "ol";
      if (!list || listType !== desiredType) {
        list = document.createElement(desiredType);
        listType = desiredType;
        container.append(list);
      }
      const item = document.createElement("li");
      inlineMarkdown(item, (unordered || ordered)[1]);
      list.append(item);
      continue;
    }
    closeList();
    const paragraph = document.createElement("p");
    inlineMarkdown(paragraph, line.replace(/^#{1,3}\s+/, ""));
    container.append(paragraph);
  }
}

async function copyAssistantMessage(message) {
  try {
    await navigator.clipboard.writeText(message.text);
    showToast(settings.interfaceLanguage === "ru" ? "Ответ скопирован" : "Response copied");
  } catch {
    showToast(settings.interfaceLanguage === "ru" ? "Не удалось скопировать ответ" : "Could not copy the response");
  }
}

function downloadAssistantMarkdown(message) {
  const chat = activeAssistantChat();
  const filename = (chat?.title || "research")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "research";
  const linkedAnswer = markdownWithTelegramLinks(message.text, state.archive);
  const markdown = `# ${chat?.title || t("New research")}\n\n${linkedAnswer}\n`;
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.md`;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function assistantMessageAction(label, icon, handler, className = "") {
  const button = document.createElement("button");
  button.className = `assistant-message-action ${className}`.trim();
  button.type = "button";
  button.setAttribute("aria-label", t(label));
  button.title = t(label);
  button.innerHTML = icon;
  const text = document.createElement("span");
  text.textContent = t(label);
  button.append(text);
  button.addEventListener("click", handler);
  return button;
}

function appendAssistantMessage(message) {
  const { role, text } = message;
  const article = document.createElement("article");
  article.className = `assistant-message ${role}`;
  article.dataset.assistantMessageId = message.id;
  const label = document.createElement("span");
  label.className = "assistant-message-label";
  const assistantName = state.provider === "r2" ? "R2 Copilot" : "Codex";
  label.textContent = role === "user"
    ? t("You")
    : `${assistantName} · ${settings.interfaceLanguage === "ru" ? "по материалам архива" : "archive grounded"}`;
  const copy = document.createElement("div");
  copy.className = "assistant-copy";
  if (role === "assistant") renderMarkdown(copy, text);
  else copy.textContent = text;
  article.append(label, copy);
  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "assistant-message-actions";
    actions.append(
      assistantMessageAction("Copy", '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>', () => copyAssistantMessage(message)),
      assistantMessageAction("Download .md", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5" /><path d="M5 20h14" /></svg>', () => downloadAssistantMarkdown(message)),
      assistantMessageAction("Create task", '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z" /><path d="m8 12 2.5 2.5L16 9M8 5V3m8 2V3" /></svg>', () => createTaskFromAssistantMessage(message), "task-action"),
    );
    article.append(actions);
  }
  elements.assistantThread.append(article);
}

function appendThinking() {
  const wrapper = document.createElement("div");
  wrapper.className = "thinking-card";
  wrapper.id = "thinkingCard";
  const dots = document.createElement("span");
  dots.className = "thinking-dots";
  dots.innerHTML = "<i></i><i></i><i></i>";
  const text = document.createElement("span");
  const assistantName = state.provider === "r2" ? "R2 Copilot" : "Codex";
  text.textContent = settings.interfaceLanguage === "ru"
    ? `${assistantName} сопоставляет связи и источники…`
    : `${assistantName} is tracing connections and sources…`;
  wrapper.append(dots, text);
  elements.assistantThread.append(wrapper);
}

function appendAssistantError(text) {
  const error = document.createElement("div");
  error.className = "assistant-error";
  error.textContent = text;
  elements.assistantThread.append(error);
}

function scrollAssistantToEnd() {
  requestAnimationFrame(() => {
    elements.assistantScroll.scrollTop = elements.assistantScroll.scrollHeight;
  });
}

function compactMessagesForQuestion(question) {
  if (!state.archive) return [];
  const messages = state.archive.messages;
  const simplify = (message) => ({
    id: message.id,
    from: message.author,
    date: message.date?.toISOString() || message.fallbackDate,
    text: message.text,
    links: message.links,
    media: message.media,
    replyTo: message.replyTo,
  });
  if (messages.length <= 7_500) return messages.map(simplify);

  const tokens = cleanText(question)
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}_-]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const scored = messages.map((message, index) => {
    const haystack = `${message.author} ${message.text} ${message.links.join(" ")}`.toLocaleLowerCase("en-US");
    let score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? token.length : 0), 0);
    if (message.links.length && /link|url|resource|source|ссыл|ресурс|источник/iu.test(question)) score += 12;
    return { index, score };
  });
  scored.sort((a, b) => b.score - a.score || b.index - a.index);
  const indexes = new Set();
  for (const item of scored.slice(0, 2_500)) {
    indexes.add(item.index - 1);
    indexes.add(item.index);
    indexes.add(item.index + 1);
  }
  messages.slice(-500).forEach((_, offset) => indexes.add(messages.length - 500 + offset));
  return messages.filter((_, index) => indexes.has(index)).slice(0, 8_500).map(simplify);
}

function setLoading(loading) {
  state.loading = loading;
  elements.sendButton.classList.toggle("loading", loading);
  elements.sendButton.setAttribute("aria-label", t(loading ? "Stop response" : "Send question"));
  elements.assistantInput.disabled = loading || !state.archive || !state.cliReady;
  elements.sendButton.disabled = loading ? false : !state.archive || !state.cliReady || !elements.assistantInput.value.trim();
  elements.modelSelect.disabled = loading || state.provider !== "r2" || !state.models.length;
  elements.assistantChatButton.disabled = loading || !state.archive;
  elements.assistantNewChatButton.disabled = loading || !state.archive;
  elements.assistantTasksButton.disabled = loading || !state.archive;
  elements.clearAssistantButton.disabled = loading || !(activeAssistantChat()?.messages.length);
  $$("#promptSuggestions button").forEach((button) => { button.disabled = loading || !state.archive || !state.cliReady; });
}

async function askCodex(question) {
  const normalizedQuestion = cleanText(question);
  if (!normalizedQuestion || !state.archive || !state.cliReady || state.loading) return;

  const chat = activeAssistantChat();
  if (!chat) return;
  const chatId = chat.id;
  const userMessage = {
    id: createLocalId("message"),
    role: "user",
    text: normalizedQuestion,
    createdAt: new Date().toISOString(),
  };
  if (!chat.messages.length) {
    chat.title = normalizedQuestion.length > 54 ? `${normalizedQuestion.slice(0, 51).trimEnd()}…` : normalizedQuestion;
  }
  chat.messages.push(userMessage);
  chat.updatedAt = userMessage.createdAt;
  persistAssistantWorkspace();
  elements.assistantWelcome.hidden = true;
  appendAssistantMessage(userMessage);
  elements.assistantChatTitle.textContent = chat.title;
  renderAssistantChatList();
  appendThinking();
  elements.assistantInput.value = "";
  resizeComposer();
  state.requestController = new AbortController();
  setLoading(true);
  scrollAssistantToEnd();

  try {
    const contextMessages = compactMessagesForQuestion(normalizedQuestion);
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: state.requestController.signal,
      body: JSON.stringify({
        question: normalizedQuestion,
        archive: {
          name: state.archive.name,
          type: state.archive.type,
          totalMessages: state.archive.messages.length,
          participantCount: state.archive.participants.length,
        },
        messages: contextMessages,
        history: chat.messages.slice(-7, -1).map(({ role, text }) => ({ role, text })),
        responseLanguage: settings.responseLanguage,
        model: state.selectedModel,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Server error ${response.status}`);
    const answer = cleanText(payload.answer);
    if (!answer) throw new Error(settings.interfaceLanguage === "ru" ? "AI вернул пустой ответ." : "AI returned an empty response.");
    $("#thinkingCard")?.remove();
    const targetChat = state.assistantWorkspace.chats.find((candidate) => candidate.id === chatId);
    if (!targetChat) throw new Error(settings.interfaceLanguage === "ru" ? "Диалог больше недоступен." : "The conversation is no longer available.");
    const assistantMessage = {
      id: createLocalId("message"),
      role: "assistant",
      text: answer,
      createdAt: new Date().toISOString(),
    };
    targetChat.messages.push(assistantMessage);
    targetChat.updatedAt = assistantMessage.createdAt;
    persistAssistantWorkspace();
    if (state.assistantWorkspace.activeChatId === chatId) appendAssistantMessage(assistantMessage);
    renderAssistantChatList();
    elements.clearAssistantButton.disabled = false;
  } catch (error) {
    $("#thinkingCard")?.remove();
    if (error.name === "AbortError") {
      appendAssistantError(settings.interfaceLanguage === "ru" ? "Запрос остановлен." : "Request stopped.");
    } else {
      appendAssistantError(error.message || (settings.interfaceLanguage === "ru" ? "Не удалось получить ответ от AI." : "Could not get an AI response."));
    }
  } finally {
    state.requestController = null;
    setLoading(false);
    scrollAssistantToEnd();
    elements.assistantInput.focus();
  }
}

function clearAssistant() {
  if (state.loading) state.requestController?.abort();
  const chat = activeAssistantChat();
  if (!chat) return;
  const messageIds = new Set(chat.messages.map((message) => message.id));
  chat.messages = [];
  chat.title = t("New research");
  chat.updatedAt = new Date().toISOString();
  state.assistantWorkspace.tasks = state.assistantWorkspace.tasks.filter((task) => !messageIds.has(task.sourceMessageId));
  persistAssistantWorkspace();
  rerenderAssistantThread();
  scrollAssistantToEnd();
}

function resizeComposer() {
  elements.assistantInput.style.height = "auto";
  elements.assistantInput.style.height = `${Math.min(elements.assistantInput.scrollHeight, 150)}px`;
  if (!state.loading) {
    elements.sendButton.disabled = !state.archive || !state.cliReady || !elements.assistantInput.value.trim();
  }
}

function updateAssistantAvailability() {
  const ready = Boolean(state.archive && state.cliReady);
  elements.assistantInput.disabled = !ready || state.loading;
  elements.assistantInput.placeholder = !state.archive
    ? t("Import an archive first…")
    : !state.cliReady
      ? (settings.interfaceLanguage === "ru" ? "AI-помощник недоступен…" : "AI assistant is unavailable…")
      : t("Ask about decisions, people, deadlines, or links…");
  $$("#promptSuggestions button").forEach((button) => { button.disabled = !ready || state.loading; });
  elements.modelSelect.disabled = state.loading || state.provider !== "r2" || !state.models.length;
  resizeComposer();
}

function renderModelOptions(catalog) {
  const models = Array.isArray(catalog?.models) ? catalog.models : [];
  state.models = models;
  elements.modelSelect.replaceChildren();
  if (!models.length) {
    elements.modelSelect.append(new Option(t("Models unavailable"), ""));
    state.selectedModel = "";
    updateAssistantAvailability();
    return;
  }
  for (const model of models) elements.modelSelect.append(new Option(model.displayName || model.apiName, model.apiName));
  const available = new Set(models.map((model) => model.apiName));
  state.selectedModel = available.has(state.selectedModel) ? state.selectedModel : catalog.defaultModel || models[0].apiName;
  elements.modelSelect.value = state.selectedModel;
  localStorage.setItem(MODEL_KEY, state.selectedModel);
  const selected = models.find((model) => model.apiName === state.selectedModel);
  elements.modelSelect.closest("label").title = selected?.description || t("Choose AI model");
  updateAssistantAvailability();
}

async function loadModels() {
  if (state.provider !== "r2") {
    elements.modelSelect.replaceChildren(new Option("Codex CLI", "codex-cli"));
    state.models = [];
    state.selectedModel = "codex-cli";
    updateAssistantAvailability();
    return;
  }
  elements.modelSelect.replaceChildren(new Option(t("Loading models…"), ""));
  elements.modelSelect.disabled = true;
  try {
    const response = await fetch("/api/models", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Server error ${response.status}`);
    renderModelOptions(payload);
  } catch {
    renderModelOptions({ models: [] });
  }
}

async function checkCliStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    const payload = await response.json();
    state.cliReady = Boolean(payload.ready);
    state.cliVersion = cleanText(payload.version);
    state.provider = cleanText(payload.provider);
    elements.cliStatus.className = `cli-status ${state.cliReady ? "ready" : "error"}`;
    elements.cliStatus.lastChild.textContent = state.cliReady
      ? state.cliVersion || t("Codex CLI ready")
      : t(state.cliVersion || "Codex CLI not found");
  } catch {
    state.cliReady = false;
    state.provider = "";
    elements.cliStatus.className = "cli-status error";
    elements.cliStatus.lastChild.textContent = t("Server unavailable");
  }
  await loadModels();
  updateAssistantAvailability();
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = type === "error"
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4v.1"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);
  elements.toastStack.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function fileFromEntry(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readDirectoryBatch(reader) {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

async function walkDroppedEntry(entry, parentPath = "") {
  const entryPath = `${parentPath}${entry.name}`;
  if (entry.isFile) {
    const file = await fileFromEntry(entry);
    return [{ path: entryPath, blob: file }];
  }
  if (!entry.isDirectory) return [];
  const reader = entry.createReader();
  const children = [];
  while (true) {
    const batch = await readDirectoryBatch(reader);
    if (!batch.length) break;
    children.push(...batch);
  }
  const nested = await Promise.all(children.map((child) => walkDroppedEntry(child, `${entryPath}/`)));
  return nested.flat();
}

async function importDroppedData(dataTransfer) {
  const directFiles = Array.from(dataTransfer?.files || []);
  if (directFiles.length === 1 && extensionOf(directFiles[0].name) === "zip") {
    await importSelection(directFiles);
    return;
  }
  const roots = Array.from(dataTransfer?.items || [])
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean);
  const hasDirectory = roots.some((entry) => entry.isDirectory);
  if (!hasDirectory) {
    await importSelection(directFiles);
    return;
  }

  try {
    setImporting(true, "Scanning the export folder…");
    const entries = (await Promise.all(roots.map((entry) => walkDroppedEntry(entry)))).flat();
    await importEntries(entries, "Folder");
  } catch (error) {
    showToast(error.message || "Could not read the export folder.", "error");
  } finally {
    setImporting(false);
  }
}

function openImportDialog() {
  elements.importDialog.showModal();
}

function closeMobileRail() {
  elements.appShell.classList.remove("rail-open");
}

function switchMobileView(view) {
  const assistant = view === "assistant";
  elements.appShell.classList.toggle("mobile-assistant", assistant);
  $$('[data-mobile-view]').forEach((button) => button.classList.toggle("active", button.dataset.mobileView === view));
  if (assistant) scrollAssistantToEnd();
}

function bindEvents() {
  elements.openSettingsButton.addEventListener("click", openSettings);
  elements.settingsForm.addEventListener("change", (event) => {
    if (event.target.name === "theme") applyTheme(event.target.value);
  });
  elements.settingsForm.addEventListener("submit", (event) => {
    if (event.submitter?.id !== "saveSettingsButton") return;
    event.preventDefault();
    saveSettings();
  });
  elements.settingsDialog.addEventListener("close", () => applyTheme(settings.theme));
  [$("#openImportButton"), $("#emptyImportButton")].forEach((button) => button.addEventListener("click", openImportDialog));
  $("#loadDemoButton").addEventListener("click", () => loadArchive(getDemoArchive(), { demo: true }));
  elements.pickArchiveButton.addEventListener("click", () => elements.archiveInput.click());
  elements.pickFolderButton.addEventListener("click", () => elements.folderInput.click());
  elements.archiveInput.addEventListener("change", () => importSelection(elements.archiveInput.files));
  elements.folderInput.addEventListener("change", () => importSelection(elements.folderInput.files));

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove("dragging");
    });
  });
  elements.dropZone.addEventListener("drop", (event) => importDroppedData(event.dataTransfer));

  $$('[data-view]').forEach((button) => button.addEventListener("click", () => setActiveView(button.dataset.view)));
  elements.archiveSearch.addEventListener("input", () => {
    state.filters.search = elements.archiveSearch.value;
    state.renderLimit = 800;
    renderMessages();
  });
  elements.clearFiltersButton.addEventListener("click", resetFilters);
  elements.jumpTodayButton.addEventListener("click", () => elements.messageStage.scrollTo({ top: elements.messageStage.scrollHeight, behavior: "smooth" }));
  elements.newerMessagesButton.addEventListener("click", () => elements.messageStage.scrollTo({ top: elements.messageStage.scrollHeight, behavior: "smooth" }));
  elements.messageStage.addEventListener("scroll", () => {
    const distance = elements.messageStage.scrollHeight - elements.messageStage.clientHeight - elements.messageStage.scrollTop;
    elements.newerMessagesButton.hidden = !state.archive || distance < 420;
  }, { passive: true });
  elements.archiveInfoButton.addEventListener("click", showArchiveInfo);

  elements.assistantInput.addEventListener("input", resizeComposer);
  elements.modelSelect.addEventListener("change", () => {
    state.selectedModel = elements.modelSelect.value;
    localStorage.setItem(MODEL_KEY, state.selectedModel);
    const selected = state.models.find((model) => model.apiName === state.selectedModel);
    elements.modelSelect.closest("label").title = selected?.description || t("Choose AI model");
  });
  elements.assistantInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      elements.assistantForm.requestSubmit();
    }
  });
  elements.assistantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.loading) {
      state.requestController?.abort();
      return;
    }
    askCodex(elements.assistantInput.value);
  });
  elements.assistantChatButton.addEventListener("click", () => {
    const open = elements.assistantChatPopover.hidden;
    elements.assistantChatPopover.hidden = !open;
    elements.assistantChatButton.setAttribute("aria-expanded", String(open));
    if (open) renderAssistantChatList();
  });
  elements.assistantNewChatButton.addEventListener("click", startNewAssistantChat);
  elements.assistantTasksButton.addEventListener("click", () => showAssistantView("tasks"));
  elements.assistantTasksBackButton.addEventListener("click", () => showAssistantView("chat"));
  document.addEventListener("click", (event) => {
    if (elements.assistantChatPopover.hidden) return;
    if (elements.assistantChatPopover.contains(event.target) || elements.assistantChatButton.contains(event.target)) return;
    closeAssistantChatPopover();
  });
  $$("#promptSuggestions button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.assistantInput.value = button.dataset.prompt;
      resizeComposer();
      askCodex(button.dataset.prompt);
    });
  });
  elements.clearAssistantButton.addEventListener("click", clearAssistant);

  elements.mobileMenuButton.addEventListener("click", () => elements.appShell.classList.add("rail-open"));
  elements.collapseRailButton.addEventListener("click", closeMobileRail);
  elements.appShell.addEventListener("click", (event) => {
    if (elements.appShell.classList.contains("rail-open") && event.target === elements.appShell) closeMobileRail();
  });
  $$('[data-mobile-view]').forEach((button) => button.addEventListener("click", () => switchMobileView(button.dataset.mobileView)));

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      if (!elements.archiveSearch.disabled) elements.archiveSearch.focus();
    }
    if (event.key === "Escape") closeMobileRail();
  });
  window.addEventListener("beforeunload", () => revokeArchiveMedia(state.archive));
}

bindEvents();
checkCliStatus();
