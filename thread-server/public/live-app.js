const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  authGate: $("#authGate"),
  authTitle: $("#authTitle"),
  authSubmit: $("#authSubmit"),
  authError: $("#authError"),
  liveApp: $("#liveApp"),
  newProjectButton: $("#newProjectButton"),
  projectList: $("#projectList"),
  projectCount: $("#projectCount"),
  projectsEmpty: $("#projectsEmpty"),
  addChatButton: $("#addChatButton"),
  projectChatList: $("#projectChatList"),
  projectChatsEmpty: $("#projectChatsEmpty"),
  telegramConnectionStatus: $("#telegramConnectionStatus"),
  connectTelegramButton: $("#connectTelegramButton"),
  liveUserAvatar: $("#liveUserAvatar"),
  liveUserName: $("#liveUserName"),
  liveUserEmail: $("#liveUserEmail"),
  signOutButton: $("#signOutButton"),
  mobileRailButton: $("#mobileRailButton"),
  openAssistantDrawerButton: $("#openAssistantDrawerButton"),
  closeAssistantDrawerButton: $("#closeAssistantDrawerButton"),
  assistantDrawer: $("#assistantDrawer"),
  assistantDrawerBackdrop: $("#assistantDrawerBackdrop"),
  liveChatAvatar: $("#liveChatAvatar"),
  liveChatTitle: $("#liveChatTitle"),
  liveChatMeta: $("#liveChatMeta"),
  syncState: $("#syncState"),
  refreshMessagesButton: $("#refreshMessagesButton"),
  projectSettingsButton: $("#projectSettingsButton"),
  selectionBar: $("#selectionBar"),
  selectedMessageCount: $("#selectedMessageCount"),
  clearSelectionButton: $("#clearSelectionButton"),
  createTaskFromSelectionButton: $("#createTaskFromSelectionButton"),
  liveMessagesEmpty: $("#liveMessagesEmpty"),
  liveMessageList: $("#liveMessageList"),
  messageLoading: $("#messageLoading"),
  emptyConnectButton: $("#emptyConnectButton"),
  telegramMessageComposer: $("#telegramMessageComposer"),
  telegramComposerIdentity: $("#telegramComposerIdentity"),
  telegramMessageInput: $("#telegramMessageInput"),
  telegramMessageSend: $("#telegramMessageSend"),
  telegramComposerShell: $("#telegramComposerShell"),
  telegramFormatToggle: $("#telegramFormatToggle"),
  telegramFormatToolbar: $("#telegramFormatToolbar"),
  telegramReplyPreview: $("#telegramReplyPreview"),
  telegramReplyAuthor: $("#telegramReplyAuthor"),
  telegramReplyText: $("#telegramReplyText"),
  telegramReplyCancel: $("#telegramReplyCancel"),
  telegramFormatButtons: $$('[data-telegram-format]'),
  assistantProjectLabel: $("#assistantProjectLabel"),
  assistantChatViewButton: $("#assistantChatViewButton"),
  assistantTasksViewButton: $("#assistantTasksViewButton"),
  newAssistantThreadButton: $("#newAssistantThreadButton"),
  liveTaskCount: $("#liveTaskCount"),
  assistantChatSurface: $("#assistantChatSurface"),
  assistantTaskSurface: $("#assistantTaskSurface"),
  assistantThreadStrip: $("#assistantThreadStrip"),
  assistantLiveMessages: $("#assistantLiveMessages"),
  assistantLiveEmpty: $("#assistantLiveEmpty"),
  assistantLiveForm: $("#assistantLiveForm"),
  assistantLiveInput: $("#assistantLiveInput"),
  assistantAttachmentPreview: $("#assistantAttachmentPreview"),
  assistantImageInput: $("#assistantImageInput"),
  assistantAttachButton: $("#assistantAttachButton"),
  assistantContextCount: $("#assistantContextCount"),
  assistantLiveSend: $("#assistantLiveSend"),
  liveModelSelect: $("#liveModelSelect"),
  liveTaskList: $("#liveTaskList"),
  liveTasksEmpty: $("#liveTasksEmpty"),
  createProjectDialog: $("#createProjectDialog"),
  createProjectForm: $("#createProjectForm"),
  projectNameInput: $("#projectNameInput"),
  projectDescriptionInput: $("#projectDescriptionInput"),
  createProjectSubmit: $("#createProjectSubmit"),
  telegramDialog: $("#telegramDialog"),
  telegramForm: $("#telegramForm"),
  telegramPhoneStep: $("#telegramPhoneStep"),
  telegramCodeStep: $("#telegramCodeStep"),
  telegramPasswordStep: $("#telegramPasswordStep"),
  telegramPhoneInput: $("#telegramPhoneInput"),
  telegramCodeInput: $("#telegramCodeInput"),
  telegramPasswordInput: $("#telegramPasswordInput"),
  telegramCodeHint: $("#telegramCodeHint"),
  telegramError: $("#telegramError"),
  telegramSubmit: $("#telegramSubmit"),
  addChatDialog: $("#addChatDialog"),
  addChatForm: $("#addChatForm"),
  addChatSearch: $("#addChatSearch"),
  availableChatList: $("#availableChatList"),
  availableChatsEmpty: $("#availableChatsEmpty"),
  createTaskDialog: $("#createTaskDialog"),
  createTaskForm: $("#createTaskForm"),
  taskSourceSummary: $("#taskSourceSummary"),
  taskDraftStats: $("#taskDraftStats"),
  taskSourcePreview: $("#taskSourcePreview"),
  taskDraftLoading: $("#taskDraftLoading"),
  taskDraftWorkspace: $("#taskDraftWorkspace"),
  taskDraftError: $("#taskDraftError"),
  taskTitleInput: $("#taskTitleInput"),
  taskDescriptionInput: $("#taskDescriptionInput"),
  createTaskSubmit: $("#createTaskSubmit"),
  projectSettingsDialog: $("#projectSettingsDialog"),
  projectSettingsForm: $("#projectSettingsForm"),
  projectInstructionsInput: $("#projectInstructionsInput"),
  projectResponseLanguage: $("#projectResponseLanguage"),
  interfaceLanguageSelect: $("#interfaceLanguageSelect"),
  themeSelect: $("#themeSelect"),
  saveProjectSettings: $("#saveProjectSettings"),
  projectAccessSection: $("#projectAccessSection"),
  projectMemberList: $("#projectMemberList"),
  projectInviteRow: $("#projectInviteRow"),
  projectInviteEmail: $("#projectInviteEmail"),
  projectInviteRole: $("#projectInviteRole"),
  createInviteButton: $("#createInviteButton"),
  projectInviteResult: $("#projectInviteResult"),
  projectInviteLink: $("#projectInviteLink"),
  copyInviteButton: $("#copyInviteButton"),
  linearIntegrationSection: $("#linearIntegrationSection"),
  linearIntegrationStatus: $("#linearIntegrationStatus"),
  linearReadiness: $("#linearReadiness"),
  connectLinearButton: $("#connectLinearButton"),
  linearDestination: $("#linearDestination"),
  linearDestinationPath: $("#linearDestinationPath"),
  linearTeamLabel: $("#linearTeamLabel"),
  linearTeamSelect: $("#linearTeamSelect"),
  linearProjectLabel: $("#linearProjectLabel"),
  linearProjectSelect: $("#linearProjectSelect"),
  linearDestinationHint: $("#linearDestinationHint"),
  migrateLocalButton: $("#migrateLocalButton"),
  migrationStatus: $("#migrationStatus"),
  liveToast: $("#liveToast"),
};

const state = {
  config: null,
  user: null,
  profile: null,
  projects: [],
  workspace: null,
  activeProjectId: "",
  activeProjectChatId: "",
  messages: [],
  selectedMessageIds: new Set(),
  connections: [],
  telegramChats: [],
  telegramStep: "phone",
  telegramConnectionId: "",
  models: [],
  activeThreadId: "",
  assistantMessages: [],
  assistantView: "chat",
  toastTimer: null,
  preferences: { interfaceLanguage: "en", theme: "dark" },
  taskDraftSourceIds: null,
  taskDraftAnchorIds: null,
  taskDraftMeta: null,
  taskDraftRequestId: 0,
  expandedTaskIds: new Set(),
  taskEditDrafts: new Map(),
  linearCatalog: null,
  linearCatalogProjectId: "",
  pendingAssistantImages: [],
  messageSyncError: "",
  telegramSending: false,
  telegramReplyMessage: null,
  telegramDrafts: new Map(),
};

const originalButtonContent = new WeakMap();
const LIVE_PREFERENCE_KEY = "thread.live-preferences.v1";
const STATIC_INTERFACE_COPY = {
  ".auth-brand small": ["Live project workspace", "Рабочее пространство проекта"],
  ".auth-heading .live-kicker": ["Private workspace", "Приватное пространство"],
  ".auth-heading > p": ["Connect your Telegram account, collect the chats that belong to a project, and keep every task linked to its source.", "Подключите Telegram, соберите нужные чаты в проекте и сохраняйте связь каждой задачи с сообщением-источником."],
  "#authSubmit": ["Continue with Telegram", "Продолжить через Telegram"],
  ".auth-footnote": ["Telegram verifies your identity. Chat content is loaded only for the active session and is not stored by Telegram Tasks.", "Telegram подтверждает личность. Содержимое чатов загружается только для активной сессии и не сохраняется в Telegram Tasks."],
  ".brand-copy small": ["Live workspace", "Рабочее пространство"],
  "#newProjectButton": ["New project", "Новый проект"],
  "#projectsHeading": ["Projects", "Проекты"],
  "#projectsEmpty": ["Create a project to start monitoring chats.", "Создайте проект, чтобы начать мониторинг чатов."],
  "#chatsHeading": ["Project chats", "Чаты проекта"],
  "#projectChatsEmpty": ["No Telegram chats in this project.", "В проекте пока нет Telegram-чатов."],
  "#refreshMessagesButton": ["Refresh", "Обновить"],
  "#syncState": ["Waiting", "Ожидание"],
  "#selectionBar > strong": ["selected", "выбрано"],
  "#selectionBar > span": ["Selected messages anchor analysis of the context loaded for this session.", "Выбранные сообщения задают тему анализа контекста, загруженного для этой сессии."],
  "#clearSelectionButton": ["Clear", "Очистить"],
  "#createTaskFromSelectionButton": ["Draft task", "Собрать задачу"],
  "#liveMessagesEmpty .live-kicker": ["Source-linked workspace", "Работа с источниками"],
  "#liveMessagesEmpty > p": ["Connect Telegram, create a project, and attach only the chats your team needs to follow.", "Подключите Telegram, создайте проект и добавьте только нужные команде чаты."],
  "#emptyConnectButton": ["Connect Telegram", "Подключить Telegram"],
  "#openAssistantDrawerButton span": ["AI chat", "AI-чат"],
  "#assistantLiveEmpty p": ["Answers use the open project chat and keep citations connected to source messages.", "Ответы используют открытый чат проекта и сохраняют ссылки на сообщения-источники."],
  ".task-surface-heading .live-kicker": ["Project folder", "Папка проекта"],
  ".task-surface-heading h2": ["Tasks with sources", "Задачи с источниками"],
  ".task-surface-heading p": ["Tasks created from messages and AI answers stay traceable.", "Задачи из сообщений и ответов AI остаются проверяемыми."],
  "#liveTasksEmpty h3": ["No tasks yet", "Задач пока нет"],
  "#liveTasksEmpty p": ["Select messages in the chat and create the first task.", "Выберите сообщения в чате и создайте первую задачу."],
  "#createProjectDialog .live-kicker": ["New workspace", "Новое пространство"],
  "#createProjectDialog header h2": ["Create project", "Создать проект"],
  "#createProjectDialog label:nth-of-type(1) > span": ["Project name", "Название проекта"],
  "#createProjectDialog label:nth-of-type(2) > span": ["Description", "Описание"],
  "#createProjectDialog label:nth-of-type(2) small": ["optional", "необязательно"],
  "#createProjectDialog footer .live-secondary": ["Cancel", "Отмена"],
  "#createProjectSubmit": ["Create project", "Создать проект"],
  "#telegramDialog .live-kicker": ["Secure connection", "Безопасное подключение"],
  "#telegramDialog header h2": ["Connect Telegram", "Подключить Telegram"],
  "#telegramPhoneStep > p": ["Telegram Tasks uses Telegram’s user authorization to read only the chats you add to projects.", "Telegram Tasks использует авторизацию пользователя Telegram и читает только добавленные в проекты чаты."],
  "#telegramPhoneStep label > span": ["Phone number", "Номер телефона"],
  "#telegramCodeStep label > span": ["Login code", "Код входа"],
  "#telegramPasswordStep > p": ["This account has Telegram two-step verification enabled.", "Для этого аккаунта включена двухэтапная проверка Telegram."],
  "#telegramPasswordStep label > span": ["2FA password", "Пароль 2FA"],
  "#telegramDialog footer .live-secondary": ["Cancel", "Отмена"],
  "#addChatDialog .live-kicker": ["Project sources", "Источники проекта"],
  "#addChatDialog header h2": ["Add Telegram chats", "Добавить Telegram-чаты"],
  "#availableChatsEmpty": ["No available chats. Refresh Telegram first.", "Нет доступных чатов. Сначала обновите Telegram."],
  "#addChatDialog footer .live-secondary": ["Done", "Готово"],
  "#createTaskDialog > form > header .live-kicker": ["Evidence-linked draft", "Черновик с источниками"],
  "#createTaskDialog header h2": ["Review technical task", "Проверьте техническую задачу"],
  "#taskTitleLabel > span": ["Task title", "Название задачи"],
  "#taskDescriptionLabel > span": ["Technical specification", "Техническое задание"],
  "#taskDescriptionLabel small": ["editable Markdown", "редактируемый Markdown"],
  "#taskDraftLoading strong": ["Reconstructing the discussion", "Восстанавливаем контекст обсуждения"],
  "#taskDraftLoading p": ["Analyzing the session-only Telegram context and drafting requirements with source links.", "Анализируем временный Telegram-контекст и формируем требования со ссылками на источники."],
  ".task-evidence-heading .live-kicker": ["Evidence window", "Окно источников"],
  "#createTaskDialog footer .live-secondary": ["Cancel", "Отмена"],
  "#createTaskSubmit": ["Create task", "Создать задачу"],
  "#projectSettingsDialog header h2": ["Instructions", "Настройки"],
  "#projectSettingsDialog > form > label:nth-of-type(1) > span": ["Assistant instructions", "Инструкции ассистенту"],
  "#projectSettingsDialog > form > label:nth-of-type(2) > span": ["Answer language", "Язык ответов"],
  ".project-appearance h3": ["Appearance", "Оформление"],
  ".project-appearance-grid label:nth-child(1) > span": ["Interface language", "Язык интерфейса"],
  ".project-appearance-grid label:nth-child(2) > span": ["Theme", "Тема"],
  ".project-access h3": ["Members", "Участники"],
  "#createInviteButton": ["Create invite", "Создать приглашение"],
  "#copyInviteButton": ["Copy link", "Копировать ссылку"],
  ".project-integration h3": ["Linear", "Linear"],
  "#connectLinearButton": ["Connect Linear", "Подключить Linear"],
  "#linearTeamLabel > span": ["Destination team", "Команда назначения"],
  "#linearProjectLabel > span": ["Linear project", "Проект Linear"],
  "#linearDestinationHint": ["Published tasks will always use this destination.", "Опубликованные задачи всегда будут отправляться в это назначение."],
  ".project-migration h3": ["Local archive tasks", "Локальные задачи архива"],
  "#migrationStatus": ["Import tasks previously saved by the archive-only workspace in this browser. Re-running the import is safe.", "Импортируйте задачи, ранее сохранённые архивной версией в этом браузере. Повторный импорт безопасен."],
  "#migrateLocalButton": ["Import local data", "Импортировать локальные данные"],
  "#projectSettingsDialog footer .live-secondary": ["Cancel", "Отмена"],
  "#saveProjectSettings": ["Save settings", "Сохранить"],
};

function setDirectText(element, value) {
  if (!element) return;
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
  if (textNode) textNode.nodeValue = ` ${value} `;
  else element.textContent = value;
}

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIVE_PREFERENCE_KEY) || "{}");
    state.preferences.interfaceLanguage = ["en", "ru"].includes(stored.interfaceLanguage) ? stored.interfaceLanguage : "en";
    state.preferences.theme = ["dark", "light"].includes(stored.theme) ? stored.theme : "dark";
  } catch {
    state.preferences = { interfaceLanguage: "en", theme: "dark" };
  }
  applyPreferences();
}

function applyPreferences() {
  const russian = state.preferences.interfaceLanguage === "ru";
  document.documentElement.lang = russian ? "ru" : "en";
  document.documentElement.dataset.theme = state.preferences.theme;
  document.title = russian ? "Telegram Tasks — рабочее пространство проекта" : "Telegram Tasks — Live project workspace";
  for (const [selector, copy] of Object.entries(STATIC_INTERFACE_COPY)) {
    document.querySelectorAll(selector).forEach((element) => setDirectText(element, copy[russian ? 1 : 0]));
  }
  elements.authTitle.replaceChildren(
    document.createTextNode(russian ? "Превращайте живые обсуждения" : "Turn live conversations"),
    document.createElement("br"),
    document.createTextNode(russian ? "в контролируемую работу." : "into accountable work."),
  );
  elements.liveMessagesEmpty.querySelector("h2").replaceChildren(
    document.createTextNode(russian ? "Выберите обсуждения," : "Choose the conversations"),
    document.createElement("br"),
    document.createTextNode(russian ? "которые двигают проект." : "that move the project."),
  );
  elements.assistantLiveEmpty.querySelector("h2").replaceChildren(
    document.createTextNode(russian ? "Спросите проект," : "Ask the project,"),
    document.createElement("br"),
    document.createTextNode(russian ? "а не свою память." : "not your memory."),
  );
  elements.projectNameInput.placeholder = russian ? "Запуск для клиента" : "Client launch";
  elements.projectDescriptionInput.placeholder = russian ? "За что отвечает этот проект" : "What this project is responsible for";
  elements.addChatSearch.placeholder = russian ? "Поиск по чатам Telegram" : "Search your Telegram chats";
  elements.taskTitleInput.placeholder = russian ? "Что нужно сделать?" : "What needs to happen?";
  elements.taskDescriptionInput.placeholder = russian ? "Здесь появится сгенерированное техническое задание." : "The generated specification will appear here.";
  elements.assistantLiveInput.placeholder = russian ? "Спросите по чату проекта…" : "Ask about this project chat…";
  elements.openAssistantDrawerButton.setAttribute("aria-label", russian ? "Открыть AI-чат" : "Open AI chat");
  elements.closeAssistantDrawerButton.setAttribute("aria-label", russian ? "Закрыть AI-чат" : "Close AI chat");
  elements.closeAssistantDrawerButton.title = russian ? "Закрыть AI-чат" : "Close AI chat";
  elements.assistantDrawerBackdrop.setAttribute("aria-label", russian ? "Закрыть AI-чат" : "Close AI chat");
  elements.telegramMessageInput.dataset.placeholder = russian ? "Напишите в этот чат Telegram…" : "Write to this Telegram chat…";
  elements.projectInstructionsInput.placeholder = russian ? "Термины продукта, ограничения, критерии готовности…" : "Product vocabulary, constraints, definition of done…";
  elements.projectResponseLanguage.options[0].textContent = russian ? "Как в вопросе" : "Match the question";
  elements.themeSelect.options[0].textContent = russian ? "Тёмная" : "Dark";
  elements.themeSelect.options[1].textContent = russian ? "Светлая" : "Light";
  elements.projectInviteRole.options[0].textContent = russian ? "Наблюдатель" : "Viewer";
  elements.projectInviteRole.options[1].textContent = russian ? "Редактор" : "Editor";
  renderMessageEmptyState();
  updateTelegramComposerAvailability();
}

function interfaceText(english, russian) {
  return state.preferences.interfaceLanguage === "ru" ? russian : english;
}

function savePreferences() {
  state.preferences = {
    interfaceLanguage: elements.interfaceLanguageSelect.value,
    theme: elements.themeSelect.value,
  };
  localStorage.setItem(LIVE_PREFERENCE_KEY, JSON.stringify(state.preferences));
  applyPreferences();
}

function clean(value) {
  return String(value ?? "").trim();
}

function initials(value, fallback = "TH") {
  const words = clean(value).split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  return (words.length === 1 ? words[0].slice(0, 2) : `${words[0][0]}${words.at(-1)[0]}`).toUpperCase();
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(interfaceText("en", "ru"), { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return formatTime(value);
  return new Intl.DateTimeFormat(interfaceText("en", "ru"), { month: "short", day: "numeric" }).format(date);
}

function setLoading(button, loading, label) {
  if (!button) return;
  if (loading) {
    if (!originalButtonContent.has(button)) {
      originalButtonContent.set(button, [...button.childNodes].map((node) => node.cloneNode(true)));
    }
    button.replaceChildren(document.createTextNode(label || interfaceText("Working…", "Работаем…")));
    button.disabled = true;
  } else {
    const original = originalButtonContent.get(button);
    if (original) button.replaceChildren(...original.map((node) => node.cloneNode(true)));
    originalButtonContent.delete(button);
    button.disabled = false;
  }
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.liveToast.textContent = message;
  elements.liveToast.hidden = false;
  state.toastTimer = setTimeout(() => { elements.liveToast.hidden = true; }, 3600);
}

function showFormError(element, message) {
  element.textContent = message || "";
  element.hidden = !message;
}

function errorMessage(error) {
  return clean(error?.message || error?.error_description || error) || interfaceText("Something went wrong.", "Что-то пошло не так.");
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !(options.body instanceof FormData)) headers["content-type"] = "application/json";
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.body === undefined || options.body instanceof FormData ? options.body : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed with ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showAuth() {
  setAssistantDrawerOpen(false, { restoreFocus: false });
  elements.liveApp.hidden = true;
  elements.authGate.hidden = false;
}

function showApp() {
  elements.authGate.hidden = true;
  elements.liveApp.hidden = false;
}

let assistantDrawerReturnFocus;

function setAssistantDrawerOpen(open, { restoreFocus = true } = {}) {
  if (!elements.assistantDrawer) return;
  if (open) assistantDrawerReturnFocus = document.activeElement;
  elements.liveApp.classList.toggle("assistant-drawer-open", open);
  elements.openAssistantDrawerButton.setAttribute("aria-expanded", String(open));
  elements.assistantDrawer.setAttribute("aria-hidden", String(!open));
  elements.assistantDrawer.inert = !open;
  elements.assistantDrawerBackdrop.setAttribute("aria-hidden", String(!open));
  if (open) {
    elements.liveApp.classList.remove("rail-open");
    requestAnimationFrame(() => {
      if (!elements.assistantLiveInput.disabled) elements.assistantLiveInput.focus();
      else elements.closeAssistantDrawerButton.focus();
    });
  } else if (restoreFocus && assistantDrawerReturnFocus?.isConnected) {
    assistantDrawerReturnFocus.focus();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  showFormError(elements.authError, "");
  if (!state.config?.telegramAuthEnabled) {
    showFormError(elements.authError, interfaceText("Telegram sign-in is not configured on this server.", "Вход через Telegram ещё не настроен на сервере."));
    return;
  }
  setLoading(elements.authSubmit, true, interfaceText("Opening Telegram…", "Открываем Telegram…"));
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(`/api/auth/telegram/start?returnTo=${encodeURIComponent(returnTo)}`);
}

async function enterWorkspace() {
  showApp();
  const [me] = await Promise.all([api("/api/platform/me"), loadModels()]);
  state.profile = me.profile;
  state.user = me.user;
  elements.liveUserName.textContent = me.profile.display_name || me.user.email?.split("@")[0] || "User";
  elements.liveUserEmail.textContent = me.user.email || "";
  elements.liveUserAvatar.textContent = initials(me.profile.display_name || me.user.email, "U");
  const urlParameters = new URLSearchParams(window.location.search);
  const inviteToken = urlParameters.get("invite");
  if (inviteToken) {
    const accepted = await api("/api/invites/accept", { method: "POST", body: { token: inviteToken } });
    history.replaceState({}, "", window.location.pathname);
    localStorage.setItem("thread.live-project.v1", accepted.projectId);
    showToast(interfaceText(`Joined ${accepted.projectName}.`, `Вы присоединились к проекту ${accepted.projectName}.`));
  }
  const linearState = urlParameters.get("linear");
  if (linearState) {
    const projectId = urlParameters.get("project");
    if (projectId) localStorage.setItem("thread.live-project.v1", projectId);
    showToast(linearState === "connected"
      ? interfaceText("Linear connected.", "Linear подключён.")
      : urlParameters.get("message") || interfaceText("Linear connection failed.", "Не удалось подключить Linear."));
    history.replaceState({}, "", window.location.pathname);
  }
  await loadConnections();
  await loadProjects();
}

async function loadProjects(selectProjectId) {
  const { projects } = await api("/api/projects");
  state.projects = projects || [];
  renderProjects();
  const preferred = selectProjectId
    || state.activeProjectId
    || localStorage.getItem("thread.live-project.v1")
    || state.projects[0]?.id;
  if (preferred && state.projects.some((project) => project.id === preferred)) await selectProject(preferred);
  else resetProjectView();
}

function renderProjects() {
  elements.projectList.replaceChildren();
  for (const project of state.projects) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `project-list-item${project.id === state.activeProjectId ? " active" : ""}`;
    const glyph = document.createElement("span");
    glyph.className = "project-glyph";
    glyph.textContent = initials(project.name, "PR");
    const name = document.createElement("span");
    name.textContent = project.name;
    button.append(glyph, name);
    button.addEventListener("click", () => selectProject(project.id));
    elements.projectList.append(button);
  }
  elements.projectCount.textContent = String(state.projects.length);
  elements.projectsEmpty.hidden = state.projects.length > 0;
}

function resetProjectView() {
  state.workspace = null;
  state.activeProjectId = "";
  state.activeProjectChatId = "";
  state.messages = [];
  state.selectedMessageIds.clear();
  state.messageSyncError = "";
  state.expandedTaskIds.clear();
  state.taskEditDrafts.clear();
  state.telegramDrafts.clear();
  elements.telegramMessageInput.replaceChildren();
  clearTelegramReply();
  renderProjects();
  renderProjectChats();
  renderMessages();
  renderTasks();
  elements.liveChatTitle.textContent = interfaceText("Choose a project", "Выберите проект");
  elements.liveChatMeta.textContent = interfaceText("Connect Telegram and add a chat", "Подключите Telegram и добавьте чат");
  elements.assistantProjectLabel.textContent = interfaceText("No project selected", "Проект не выбран");
  elements.addChatButton.disabled = true;
  elements.refreshMessagesButton.disabled = true;
  elements.projectSettingsButton.disabled = true;
  elements.newAssistantThreadButton.disabled = true;
  updateTelegramComposerAvailability();
}

async function selectProject(projectId) {
  if (!projectId) return;
  if (state.activeProjectId !== projectId) {
    state.expandedTaskIds.clear();
    state.taskEditDrafts.clear();
  }
  state.activeProjectId = projectId;
  localStorage.setItem("thread.live-project.v1", projectId);
  renderProjects();
  const workspace = await api(`/api/projects/${projectId}/workspace`);
  if (state.activeProjectId !== projectId) return;
  state.workspace = workspace;
  state.activeThreadId = workspace.threads?.[0]?.id || "";
  await loadModels();
  elements.assistantProjectLabel.textContent = workspace.project.name;
  elements.addChatButton.disabled = !canEditProject() || !state.connections.some((connection) => connection.status === "connected");
  elements.projectSettingsButton.disabled = false;
  elements.newAssistantThreadButton.disabled = false;
  renderProjects();
  renderProjectChats();
  renderTasks();
  renderThreads();
  populateProjectSettings();
  const preferredChat = state.activeProjectChatId && workspace.chats.some((chat) => chat.id === state.activeProjectChatId)
    ? state.activeProjectChatId
    : workspace.chats[0]?.id;
  if (preferredChat) await selectProjectChat(preferredChat);
  else {
    state.activeProjectChatId = "";
    state.messages = [];
    elements.liveChatTitle.textContent = workspace.project.name;
    elements.liveChatMeta.textContent = interfaceText("Add a Telegram chat to start monitoring messages", "Добавьте Telegram-чат, чтобы начать мониторинг сообщений");
    renderMessages();
    updateAssistantAvailability();
  }
  if (state.activeThreadId) await loadAssistantMessages(state.activeThreadId);
  else renderAssistantMessages();
}

function renderProjectChats() {
  elements.projectChatList.replaceChildren();
  const chats = state.workspace?.chats || [];
  for (const projectChat of chats) {
    const chat = projectChat.telegram_chats;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chat-list-item${projectChat.id === state.activeProjectChatId ? " active" : ""}`;
    const glyph = document.createElement("span");
    glyph.className = "chat-glyph";
    glyph.textContent = initials(chat.title, "TG");
    const title = document.createElement("span");
    title.textContent = chat.title;
    const time = document.createElement("time");
    time.textContent = formatShortDate(chat.last_message_at);
    button.append(glyph, title, time);
    button.addEventListener("click", () => selectProjectChat(projectChat.id));
    elements.projectChatList.append(button);
  }
  elements.projectChatsEmpty.hidden = chats.length > 0;
}

function activeProjectChat() {
  return state.workspace?.chats?.find((chat) => chat.id === state.activeProjectChatId) || null;
}

function currentProjectRole() {
  return state.workspace?.members?.find((member) => member.user_id === state.user?.id)?.role || "viewer";
}

function canEditProject() {
  return ["owner", "editor"].includes(currentProjectRole());
}

function activeTelegramConnection() {
  const connectionId = activeProjectChat()?.telegram_chats?.connection_id;
  return state.connections.find((connection) => connection.id === connectionId && connection.status === "connected") || null;
}

function canManageActiveTelegramChat() {
  return canEditProject() && Boolean(activeTelegramConnection());
}

async function selectProjectChat(projectChatId, { sourceId = "" } = {}) {
  if (state.activeProjectChatId) {
    const draft = elements.telegramMessageInput.innerHTML;
    if (clean(elements.telegramMessageInput.textContent)) state.telegramDrafts.set(state.activeProjectChatId, draft);
    else state.telegramDrafts.delete(state.activeProjectChatId);
  }
  clearTelegramReply();
  state.activeProjectChatId = projectChatId;
  state.messages = [];
  state.selectedMessageIds.clear();
  state.messageSyncError = "";
  renderProjectChats();
  const projectChat = activeProjectChat();
  if (!projectChat) return;
  const chat = projectChat.telegram_chats;
  elements.liveChatAvatar.textContent = initials(chat.title, "TG");
  elements.liveChatTitle.textContent = chat.title;
  elements.liveChatMeta.textContent = `${chat.kind.replace("_", " ")} · ${interfaceText("session-only context", "контекст только на эту сессию")}`;
  elements.refreshMessagesButton.disabled = !canManageActiveTelegramChat();
  elements.telegramMessageInput.innerHTML = state.telegramDrafts.get(projectChatId) || "";
  updateTelegramComposerAvailability();
  await subscribeToProjectChat();
  await loadMessages({ sourceId });
  if (state.activeProjectChatId === projectChatId && !state.messages.length && canManageActiveTelegramChat()) {
    await refreshMessages({ quiet: true });
  }
}

async function loadMessages({ quiet = false, sourceId = "" } = {}) {
  const projectChat = activeProjectChat();
  if (!projectChat) return;
  if (!quiet) {
    elements.messageLoading.hidden = false;
    elements.liveMessageList.hidden = true;
    elements.liveMessagesEmpty.hidden = true;
  }
  try {
    renderMessages();
  } finally {
    elements.messageLoading.hidden = true;
  }
}

function renderMessages() {
  elements.liveMessageList.replaceChildren();
  const hasMessages = state.messages.length > 0;
  elements.liveMessagesEmpty.hidden = Boolean(state.activeProjectChatId) && hasMessages;
  if (!state.activeProjectChatId) elements.liveMessagesEmpty.hidden = false;
  elements.liveMessageList.hidden = !hasMessages;
  renderMessageEmptyState();

  const fragment = document.createDocumentFragment();
  let currentDate = "";
  for (const message of state.messages) {
    const date = new Date(message.sent_at);
    const dateKey = Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (dateKey && dateKey !== currentDate) {
      currentDate = dateKey;
      const divider = document.createElement("div");
      divider.className = "message-date-divider";
      divider.textContent = new Intl.DateTimeFormat(state.preferences.interfaceLanguage === "ru" ? "ru" : "en", {
        day: "numeric",
        month: "long",
        ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
      }).format(date);
      fragment.append(divider);
    }
    fragment.append(renderMessage(message));
  }
  elements.liveMessageList.append(fragment);
  elements.assistantContextCount.textContent = interfaceText(
    `${state.messages.length.toLocaleString("en")} messages in context`,
    `${state.messages.length.toLocaleString("ru")} сообщений в контексте`,
  );
  renderSelection();
  updateAssistantAvailability();
  updateTelegramComposerAvailability();
  if (hasMessages) requestAnimationFrame(() => { elements.liveMessageList.scrollTop = elements.liveMessageList.scrollHeight; });
}

function renderMessageEmptyState() {
  const kicker = elements.liveMessagesEmpty.querySelector(".live-kicker");
  const heading = elements.liveMessagesEmpty.querySelector("h2");
  const description = elements.liveMessagesEmpty.querySelector("p");
  const projectChat = activeProjectChat();
  const connected = state.connections.some((connection) => connection.status === "connected");
  if (projectChat) {
    kicker.textContent = interfaceText("Telegram conversation", "Чат Telegram");
    heading.textContent = interfaceText("No messages loaded yet.", "Сообщения ещё не загружены.");
    description.textContent = state.messageSyncError || interfaceText(
      `Load ${projectChat.telegram_chats.title} for this session. Telegram Tasks will not store the conversation.`,
      `Загрузите ${projectChat.telegram_chats.title} для этой сессии. Telegram Tasks не сохранит переписку.`,
    );
    elements.emptyConnectButton.textContent = interfaceText("Load messages", "Загрузить сообщения");
    return;
  }
  if (state.activeProjectId) {
    kicker.textContent = interfaceText("Project conversations", "Чаты проекта");
    heading.textContent = interfaceText("Add a Telegram chat.", "Добавьте чат Telegram.");
    description.textContent = interfaceText(
      "Choose the groups and conversations this project should monitor.",
      "Выберите группы и переписки, за которыми должен следить проект.",
    );
    elements.emptyConnectButton.textContent = connected ? interfaceText("Add chat", "Добавить чат") : interfaceText("Connect Telegram", "Подключить Telegram");
    return;
  }
  kicker.textContent = interfaceText("Source-linked workspace", "Работа с источниками");
  heading.replaceChildren(
    document.createTextNode(interfaceText("Choose the conversations", "Выберите обсуждения,")),
    document.createElement("br"),
    document.createTextNode(interfaceText("that move the project.", "которые двигают проект.")),
  );
  description.textContent = interfaceText(
    "Connect Telegram, create a project, and attach only the chats your team needs to follow.",
    "Подключите Telegram, создайте проект и добавьте только нужные команде чаты.",
  );
  elements.emptyConnectButton.textContent = interfaceText("Connect Telegram", "Подключить Telegram");
}

function isOwnTelegramMessage(message) {
  const ownerId = activeProjectChat()?.telegram_chats?.owner_telegram_user_id
    || activeTelegramConnection()?.telegram_user_id;
  return Boolean(ownerId && message.sender_telegram_id && String(ownerId) === String(message.sender_telegram_id));
}

function safeMessageHref(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function linkifyMessageText(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (node.parentElement?.closest("a, code")) continue;
    const value = node.nodeValue || "";
    const pattern = /https?:\/\/[^\s<]+/g;
    const matches = [...value.matchAll(pattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      fragment.append(document.createTextNode(value.slice(cursor, match.index)));
      const raw = match[0];
      const trailing = raw.match(/[),.!?]+$/)?.[0] || "";
      const hrefText = trailing ? raw.slice(0, -trailing.length) : raw;
      const href = safeMessageHref(hrefText);
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = hrefText;
        fragment.append(link);
      } else fragment.append(document.createTextNode(hrefText));
      if (trailing) fragment.append(document.createTextNode(trailing));
      cursor = match.index + raw.length;
    }
    fragment.append(document.createTextNode(value.slice(cursor)));
    node.replaceWith(fragment);
  }
}

function renderTelegramMessageText(message) {
  const container = document.createElement("p");
  container.className = "message-text";
  const value = String(message.text || "");
  const entities = (Array.isArray(message.entities) ? message.entities : [])
    .map((entity) => ({ ...entity, offset: Number(entity.offset), length: Number(entity.length) }))
    .filter((entity) => Number.isInteger(entity.offset) && Number.isInteger(entity.length) && entity.length > 0
      && entity.offset >= 0 && entity.offset + entity.length <= value.length);
  const boundaries = [...new Set([0, value.length, ...entities.flatMap((entity) => [entity.offset, entity.offset + entity.length])])]
    .sort((left, right) => left - right);
  const tagByType = { bold: "strong", italic: "em", underline: "u", strike: "s", code: "code", pre: "code" };
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (end <= start) continue;
    let node = document.createTextNode(value.slice(start, end));
    const active = entities.filter((entity) => entity.offset <= start && entity.offset + entity.length >= end);
    for (const entity of active.reverse()) {
      if (["url", "text_url"].includes(entity.type)) {
        const href = safeMessageHref(entity.type === "text_url" ? entity.url : value.slice(start, end));
        if (href) {
          const link = document.createElement("a");
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.append(node);
          node = link;
        }
        continue;
      }
      const tag = tagByType[entity.type];
      if (!tag) continue;
      const wrapper = document.createElement(tag);
      if (entity.type === "pre") wrapper.className = "message-code-block";
      wrapper.append(node);
      node = wrapper;
    }
    container.append(node);
  }
  if (!container.childNodes.length) container.textContent = value;
  linkifyMessageText(container);
  return container;
}

const MESSAGE_ACTION_ICONS = Object.freeze({
  reply: '<path d="M9 8 4.5 12 9 16"/><path d="M5 12h8.5a6 6 0 0 1 6 6"/>',
  task: '<rect x="5.5" y="4" width="13" height="16" rx="2.5"/><path d="M9 4.5V3h6v1.5"/><path d="m9 12 2 2 4-5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
});

function createMessageAction(label, handler, className = "") {
  const action = document.createElement("button");
  action.type = "button";
  action.className = className;
  action.setAttribute("aria-label", label);
  action.title = label;
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = MESSAGE_ACTION_ICONS[className] || "";
  action.append(icon);
  action.addEventListener("click", handler);
  return action;
}

function renderMessage(message) {
  const own = isOwnTelegramMessage(message);
  const article = document.createElement("article");
  article.className = `live-message-row ${own ? "own" : "incoming"}${state.selectedMessageIds.has(message.id) ? " selected" : ""}`;
  article.id = `message-${message.id}`;
  article.dataset.telegramMessageId = String(message.telegram_message_id);

  const select = document.createElement("label");
  select.className = "message-select";
  select.title = interfaceText("Select message", "Выбрать сообщение");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.selectedMessageIds.has(message.id);
  checkbox.disabled = !canEditProject();
  checkbox.setAttribute("aria-label", interfaceText(`Select message from ${message.sender_name}`, `Выбрать сообщение от ${message.sender_name}`));
  checkbox.addEventListener("change", () => toggleMessageSelection(message.id, checkbox.checked));
  select.append(checkbox);

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = initials(message.sender_name, "U");

  const content = document.createElement("div");
  content.className = "message-content";
  content.tabIndex = 0;
  content.setAttribute("aria-label", interfaceText(`Message from ${message.sender_name}`, `Сообщение от ${message.sender_name}`));
  const byline = document.createElement("div");
  byline.className = "message-byline";
  const author = document.createElement("strong");
  author.textContent = own ? interfaceText("You", "Вы") : message.sender_name;
  byline.append(author);
  if (!own) content.append(byline);

  if (message.reply_to_message_id) {
    const target = state.messages.find((candidate) => Number(candidate.telegram_message_id) === Number(message.reply_to_message_id));
    const reply = document.createElement("button");
    reply.type = "button";
    reply.className = "message-reply";
    const replyAuthor = document.createElement("strong");
    replyAuthor.textContent = target?.sender_name || interfaceText(`Message #${message.reply_to_message_id}`, `Сообщение #${message.reply_to_message_id}`);
    const replyText = document.createElement("span");
    replyText.textContent = clean(target?.text).slice(0, 140) || interfaceText("Open replied message", "Открыть исходное сообщение");
    reply.append(replyAuthor, replyText);
    reply.addEventListener("click", () => focusTelegramMessage(message.reply_to_message_id));
    content.append(reply);
  }

  if (message.text) content.append(renderTelegramMessageText(message));

  if (message.telegram_message_media?.length) {
    const media = document.createElement("div");
    media.className = "message-media";
    for (const item of message.telegram_message_media) {
      const label = `${item.kind}${item.file_name ? ` · ${item.file_name}` : ""}`;
      if (item.signed_url && item.mime_type?.startsWith("image/")) {
        const link = document.createElement("a");
        link.className = "message-media-image";
        link.href = item.signed_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const image = document.createElement("img");
        image.src = item.signed_url;
        image.alt = item.file_name || `${item.kind} attachment`;
        image.loading = "lazy";
        const caption = document.createElement("span");
        caption.textContent = label;
        link.append(image, caption);
        media.append(link);
      } else {
        const chip = item.signed_url ? document.createElement("a") : document.createElement("span");
        chip.className = `message-media-item${item.download_status === "available" ? " available" : ""}`;
        chip.textContent = label;
        if (item.signed_url) {
          chip.href = item.signed_url;
          chip.target = "_blank";
          chip.rel = "noopener noreferrer";
          chip.download = item.file_name || "telegram-attachment";
        }
        media.append(chip);
      }
    }
    content.append(media);
  }

  const meta = document.createElement("div");
  meta.className = "message-meta";
  const messageId = document.createElement("span");
  messageId.textContent = `#${message.telegram_message_id}`;
  const time = document.createElement("time");
  time.dateTime = message.sent_at;
  time.textContent = formatTime(message.sent_at);
  meta.append(messageId, time);
  if (message.edited_at) {
    const edited = document.createElement("span");
    edited.className = "message-edited";
    edited.textContent = interfaceText("edited", "изменено");
    meta.append(edited);
  }
  if (own) {
    const sent = document.createElement("span");
    sent.className = "message-sent-mark";
    sent.textContent = "✓";
    sent.title = interfaceText("Sent", "Отправлено");
    meta.append(sent);
  }
  content.append(meta);

  const actions = document.createElement("div");
  actions.className = "message-actions";
  if (canManageActiveTelegramChat()) {
    actions.append(createMessageAction(interfaceText("Reply", "Ответить"), () => setTelegramReply(message), "reply"));
  }
  if (canEditProject()) {
    const taskAction = createMessageAction(interfaceText("Task", "Задача"), () => {
      toggleMessageSelection(message.id, !state.selectedMessageIds.has(message.id));
    }, "task");
    taskAction.setAttribute("aria-pressed", String(state.selectedMessageIds.has(message.id)));
    actions.append(taskAction);
  }
  actions.append(createMessageAction(interfaceText("Copy", "Копировать"), async () => {
    await navigator.clipboard.writeText(message.text || "");
    showToast(interfaceText("Message copied.", "Сообщение скопировано."));
  }, "copy"));

  const lane = document.createElement("div");
  lane.className = "message-lane";
  lane.append(content, actions);
  article.append(select, avatar, lane);
  return article;
}

function toggleMessageSelection(messageId, selected) {
  if (selected) state.selectedMessageIds.add(messageId);
  else state.selectedMessageIds.delete(messageId);
  const row = document.getElementById(`message-${messageId}`);
  row?.classList.toggle("selected", selected);
  const checkbox = row?.querySelector('.message-select input[type="checkbox"]');
  if (checkbox) checkbox.checked = selected;
  const taskAction = row?.querySelector(".message-actions .task");
  if (taskAction) taskAction.setAttribute("aria-pressed", String(selected));
  renderSelection();
}

function renderSelection() {
  const count = state.selectedMessageIds.size;
  elements.selectionBar.hidden = count === 0;
  elements.liveMessageList.classList.toggle("selection-active", count > 0);
  elements.selectedMessageCount.textContent = String(count);
}

function clearSelection() {
  state.selectedMessageIds.clear();
  $$(".live-message-row.selected").forEach((row) => row.classList.remove("selected"));
  $$(".message-select input").forEach((input) => { input.checked = false; });
  renderSelection();
}

function focusTelegramMessage(telegramMessageId) {
  const row = elements.liveMessageList.querySelector(`[data-telegram-message-id="${CSS.escape(String(telegramMessageId))}"]`);
  if (!row) return;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.animate([{ background: "rgba(51,150,232,.24)" }, { background: "transparent" }], { duration: 1400, easing: "ease-out" });
}

async function subscribeToProjectChat() {
  const projectChat = activeProjectChat();
  if (!projectChat) return;
  elements.syncState.className = "sync-state";
  elements.syncState.lastChild.textContent = interfaceText(" Session only", " Только сессия");
}

async function loadConnections() {
  if (!state.config?.telegramEnabled) {
    state.connections = [];
    elements.telegramConnectionStatus.textContent = interfaceText("Setup required", "Нужна настройка");
    elements.connectTelegramButton.textContent = interfaceText("Not configured", "Не настроено");
    elements.connectTelegramButton.disabled = true;
    elements.emptyConnectButton.disabled = true;
    elements.addChatButton.disabled = true;
    updateTelegramComposerAvailability();
    return null;
  }
  const { connections } = await api("/api/telegram/connections");
  state.connections = connections || [];
  const connected = state.connections.find((connection) => connection.status === "connected");
  if (connected) {
    elements.telegramConnectionStatus.textContent = connected.display_name || connected.username || connected.phone_hint || interfaceText("Connected", "Подключено");
    elements.connectTelegramButton.textContent = interfaceText("Refresh", "Обновить");
  } else {
    const pending = state.connections.find((connection) => ["code_required", "password_required"].includes(connection.status));
    elements.telegramConnectionStatus.textContent = pending ? interfaceText("Login incomplete", "Вход не завершён") : interfaceText("Not connected", "Не подключено");
    elements.connectTelegramButton.textContent = pending ? interfaceText("Resume", "Продолжить") : interfaceText("Connect", "Подключить");
  }
  elements.addChatButton.disabled = !state.activeProjectId || !canEditProject() || !connected;
  elements.refreshMessagesButton.disabled = !canManageActiveTelegramChat();
  updateTelegramComposerAvailability();
  return connected;
}

function setTelegramStep(step) {
  state.telegramStep = step;
  elements.telegramPhoneStep.hidden = step !== "phone";
  elements.telegramCodeStep.hidden = step !== "code";
  elements.telegramPasswordStep.hidden = step !== "password";
  elements.telegramSubmit.textContent = step === "phone"
    ? interfaceText("Send code", "Отправить код")
    : step === "code" ? interfaceText("Verify code", "Проверить код") : interfaceText("Connect account", "Подключить аккаунт");
  showFormError(elements.telegramError, "");
}

async function openTelegramDialog() {
  if (!state.config?.telegramEnabled) {
    showToast(interfaceText("Add Telegram API credentials to the server environment first.", "Сначала добавьте Telegram API credentials в окружение сервера."));
    return;
  }
  const connected = state.connections.find((connection) => connection.status === "connected");
  if (connected) {
    setLoading(elements.connectTelegramButton, true, interfaceText("Refreshing…", "Обновляем…"));
    try {
      const result = await api("/api/telegram/refresh-dialogs", { method: "POST", body: { connectionId: connected.id } });
      showToast(interfaceText(`${result.count} Telegram chats refreshed.`, `Обновлено Telegram-чатов: ${result.count}.`));
      if (state.activeProjectId) await openAddChatDialog();
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setLoading(elements.connectTelegramButton, false);
    }
    return;
  }
  const pending = state.connections.find((connection) => ["code_required", "password_required"].includes(connection.status));
  state.telegramConnectionId = pending?.id || "";
  setTelegramStep(pending?.status === "password_required" ? "password" : pending ? "code" : "phone");
  elements.telegramDialog.showModal();
}

async function handleTelegramSubmit(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    elements.telegramDialog.close();
    return;
  }
  showFormError(elements.telegramError, "");
  setLoading(elements.telegramSubmit, true, state.telegramStep === "phone" ? interfaceText("Sending…", "Отправляем…") : interfaceText("Verifying…", "Проверяем…"));
  try {
    if (state.telegramStep === "phone") {
      const result = await api("/api/telegram/connect", { method: "POST", body: { phoneNumber: elements.telegramPhoneInput.value } });
      state.telegramConnectionId = result.connectionId;
      elements.telegramCodeHint.textContent = result.delivery === "telegram"
        ? interfaceText("Enter the code sent to your Telegram app.", "Введите код, отправленный в приложение Telegram.")
        : interfaceText("Enter the code sent by SMS.", "Введите код из SMS.");
      setTelegramStep("code");
      elements.telegramCodeInput.focus();
    } else if (state.telegramStep === "code") {
      const result = await api("/api/telegram/verify-code", { method: "POST", body: { connectionId: state.telegramConnectionId, code: elements.telegramCodeInput.value } });
      if (result.status === "password_required") {
        setTelegramStep("password");
        elements.telegramPasswordInput.focus();
      } else {
        elements.telegramDialog.close();
        showToast(interfaceText(`Telegram connected · ${result.chatCount} chats found.`, `Telegram подключён · найдено чатов: ${result.chatCount}.`));
        await loadConnections();
      }
    } else {
      const result = await api("/api/telegram/verify-password", { method: "POST", body: { connectionId: state.telegramConnectionId, password: elements.telegramPasswordInput.value } });
      elements.telegramPasswordInput.value = "";
      elements.telegramDialog.close();
      showToast(interfaceText(`Telegram connected · ${result.chatCount} chats found.`, `Telegram подключён · найдено чатов: ${result.chatCount}.`));
      await loadConnections();
    }
  } catch (error) {
    showFormError(elements.telegramError, errorMessage(error));
  } finally {
    setLoading(elements.telegramSubmit, false);
  }
}

async function openAddChatDialog() {
  if (!state.activeProjectId) return;
  const connected = state.connections.find((connection) => connection.status === "connected");
  if (!connected) {
    await openTelegramDialog();
    return;
  }
  const { chats } = await api(`/api/telegram/chats?connectionId=${encodeURIComponent(connected.id)}`);
  state.telegramChats = chats || [];
  elements.addChatSearch.value = "";
  renderAvailableChats();
  elements.addChatDialog.showModal();
}

function renderAvailableChats() {
  const query = elements.addChatSearch.value.trim().toLocaleLowerCase("en");
  const attached = new Set((state.workspace?.chats || []).map((item) => item.telegram_chats.id));
  const chats = state.telegramChats.filter((chat) => !attached.has(chat.id) && (!query || chat.title.toLocaleLowerCase("en").includes(query)));
  elements.availableChatList.replaceChildren();
  for (const chat of chats) {
    const row = document.createElement("article");
    row.className = "available-chat-item";
    const glyph = document.createElement("span");
    glyph.className = "chat-glyph";
    glyph.textContent = initials(chat.title, "TG");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = chat.title;
    const meta = document.createElement("small");
    meta.textContent = `${chat.kind.replace("_", " ")}${chat.username ? ` · @${chat.username}` : ""}`;
    copy.append(title, meta);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "live-secondary";
    add.textContent = interfaceText("Add", "Добавить");
    add.addEventListener("click", () => addChatToProject(chat, add));
    row.append(glyph, copy, add);
    elements.availableChatList.append(row);
  }
  elements.availableChatsEmpty.hidden = chats.length > 0;
}

async function addChatToProject(chat, button) {
  setLoading(button, true, interfaceText("Adding…", "Добавляем…"));
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/chats`, { method: "POST", body: { telegramChatId: chat.id } });
    showToast(interfaceText(`${chat.title} added. Loading messages…`, `${chat.title} добавлен. Загружаем сообщения…`));
    await refreshWorkspace({ preferredProjectChatId: result.projectChat.id });
    renderAvailableChats();
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(button, false);
  }
}

async function refreshWorkspace({ preserveChat = false, preferredProjectChatId } = {}) {
  const projectId = state.activeProjectId;
  if (!projectId) return;
  const current = preserveChat ? state.activeProjectChatId : preferredProjectChatId || state.activeProjectChatId;
  const workspace = await api(`/api/projects/${projectId}/workspace`);
  if (state.activeProjectId !== projectId) return;
  state.workspace = workspace;
  renderProjectChats();
  renderTasks();
  renderThreads();
  if (current && workspace.chats.some((chat) => chat.id === current)) {
    state.activeProjectChatId = current;
    renderProjectChats();
    renderMessages();
  } else if (workspace.chats[0]) await selectProjectChat(workspace.chats[0].id);
}

async function refreshMessages({ quiet = false } = {}) {
  const projectChat = activeProjectChat();
  if (!state.activeProjectId || !projectChat) return false;
  setLoading(elements.refreshMessagesButton, true, interfaceText("Loading…", "Загрузка…"));
  elements.syncState.className = "sync-state syncing";
  elements.syncState.lastChild.textContent = interfaceText(" Loading", " Загрузка");
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/refresh`, {
      method: "POST",
      body: { chatId: projectChat.telegram_chats.id },
    });
    const failed = (result.results || []).filter((item) => !item.ok).length;
    if (failed) {
      const failure = result.results.find((item) => !item.ok);
      throw new Error(failure?.error || interfaceText("Telegram context could not be loaded.", "Не удалось загрузить Telegram-контекст."));
    }
    state.messageSyncError = "";
    const refreshed = (result.results || []).find((item) => item.ok && String(item.chatId) === String(projectChat.telegram_chats.id));
    state.messages = refreshed?.messages || [];
    renderMessages();
    if (!quiet) showToast(interfaceText("Conversation loaded for this session.", "Чат загружен только для этой сессии."));
    elements.syncState.className = "sync-state";
    elements.syncState.lastChild.textContent = interfaceText(" Session only", " Только сессия");
    return true;
  } catch (error) {
    state.messageSyncError = errorMessage(error);
    elements.syncState.className = "sync-state error";
    elements.syncState.lastChild.textContent = interfaceText(" Error", " Ошибка");
    showToast(errorMessage(error));
    renderMessages();
    return false;
  } finally {
    setLoading(elements.refreshMessagesButton, false);
  }
}

function updateTelegramComposerAvailability() {
  const projectChat = activeProjectChat();
  const available = Boolean(projectChat && canManageActiveTelegramChat() && !state.telegramSending);
  elements.telegramMessageComposer.hidden = !projectChat;
  elements.telegramMessageInput.contentEditable = available ? "true" : "false";
  elements.telegramMessageInput.setAttribute("aria-disabled", String(!available));
  elements.telegramFormatToggle.disabled = !available;
  elements.telegramFormatButtons.forEach((button) => { button.disabled = !available; });
  if (!available) setTelegramFormattingOpen(false);
  elements.telegramMessageSend.disabled = !available || !clean(serializeTelegramRichInput(elements.telegramMessageInput).text);
  const displayName = state.profile?.display_name || state.user?.email?.split("@")[0] || interfaceText("yourself", "себя");
  elements.telegramComposerIdentity.textContent = interfaceText(`Send as ${displayName}`, `Отправить как ${displayName}`);
  if (projectChat) {
    elements.telegramMessageInput.dataset.placeholder = interfaceText(
      `Message ${projectChat.telegram_chats.title}…`,
      `Написать в ${projectChat.telegram_chats.title}…`,
    );
  }
}

function serializeTelegramRichInput(root) {
  let text = "";
  const entities = [];
  const append = (value) => { text += value; };
  const ensureNewline = () => { if (text && !text.endsWith("\n")) append("\n"); };
  const entityTypes = {
    B: "bold",
    STRONG: "bold",
    I: "italic",
    EM: "italic",
    U: "underline",
    S: "strike",
    STRIKE: "strike",
    CODE: "code",
  };

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      append(String(node.nodeValue || "").replace(/\u00a0/g, " "));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;
    if (tag === "BR") {
      append("\n");
      return;
    }
    if (tag === "UL" || tag === "OL") {
      ensureNewline();
      [...node.children].filter((child) => child.tagName === "LI").forEach((item, index) => {
        append(tag === "UL" ? "• " : `${index + 1}. `);
        [...item.childNodes].forEach(walk);
        ensureNewline();
      });
      return;
    }
    const block = ["DIV", "P", "PRE"].includes(tag);
    if (block) ensureNewline();
    const start = text.length;
    [...node.childNodes].forEach(walk);
    const type = tag === "PRE" ? "pre" : entityTypes[tag];
    if (type && text.length > start) entities.push({ type, offset: start, length: text.length - start });
    if (block) ensureNewline();
  }

  [...root.childNodes].forEach(walk);
  return {
    text,
    entities: entities
      .filter((entity) => entity.length > 0)
      .sort((left, right) => left.offset - right.offset || right.length - left.length),
  };
}

function renderTelegramReplyPreview() {
  const message = state.telegramReplyMessage;
  elements.telegramReplyPreview.hidden = !message;
  if (!message) return;
  elements.telegramReplyAuthor.textContent = interfaceText(`Reply to ${message.sender_name}`, `Ответ для ${message.sender_name}`);
  elements.telegramReplyText.textContent = clean(message.text).slice(0, 160) || interfaceText("Attachment", "Вложение");
}

function setTelegramFormattingOpen(open) {
  const expanded = Boolean(open);
  elements.telegramFormatToolbar.hidden = !expanded;
  elements.telegramFormatToggle.setAttribute("aria-expanded", String(expanded));
  elements.telegramFormatToggle.classList.toggle("active", expanded);
}

function setTelegramReply(message) {
  state.telegramReplyMessage = message;
  renderTelegramReplyPreview();
  elements.telegramMessageInput.focus();
}

function clearTelegramReply() {
  state.telegramReplyMessage = null;
  renderTelegramReplyPreview();
}

function applyTelegramComposerFormat(format) {
  const editor = elements.telegramMessageInput;
  if (editor.contentEditable !== "true") return;
  editor.focus();
  if (format === "bold" || format === "italic") {
    document.execCommand(format, false);
  } else if (format === "bullet" || format === "number") {
    document.execCommand(format === "bullet" ? "insertUnorderedList" : "insertOrderedList", false);
  } else if (format === "code") {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (range && editor.contains(range.commonAncestorContainer)) {
      const parent = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      const activeCode = parent?.closest?.("code");
      if (activeCode && editor.contains(activeCode)) {
        activeCode.replaceWith(...activeCode.childNodes);
      } else {
        const code = document.createElement("code");
        if (range.collapsed) code.textContent = interfaceText("code", "код");
        else code.append(range.extractContents());
        range.insertNode(code);
        selection.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(code);
        if (!range.collapsed) nextRange.collapse(false);
        selection.addRange(nextRange);
      }
    }
  }
  editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "formatChange" }));
}

async function handleTelegramMessageSubmit(event) {
  event.preventDefault();
  const projectChat = activeProjectChat();
  const payload = serializeTelegramRichInput(elements.telegramMessageInput);
  const text = payload.text.trim();
  if (!projectChat || !text || state.telegramSending) return;
  state.telegramSending = true;
  elements.telegramMessageSend.classList.add("sending");
  elements.telegramMessageSend.setAttribute("aria-busy", "true");
  updateTelegramComposerAvailability();
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/messages`, {
      method: "POST",
      body: {
        chatId: projectChat.telegram_chats.id,
        text: payload.text,
        entities: payload.entities,
        replyToMessageId: state.telegramReplyMessage?.telegram_message_id || null,
      },
    });
    elements.telegramMessageInput.replaceChildren();
    state.telegramDrafts.delete(state.activeProjectChatId);
    setTelegramFormattingOpen(false);
    clearTelegramReply();
    state.messageSyncError = "";
    state.messages.push(result.message);
    renderMessages();
    showToast(interfaceText("Sent to Telegram.", "Отправлено в Telegram."));
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    state.telegramSending = false;
    elements.telegramMessageSend.classList.remove("sending");
    elements.telegramMessageSend.removeAttribute("aria-busy");
    updateTelegramComposerAvailability();
    elements.telegramMessageInput.focus();
  }
}

async function handleCreateProject(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    elements.createProjectDialog.close();
    return;
  }
  setLoading(elements.createProjectSubmit, true, interfaceText("Creating…", "Создаём…"));
  try {
    const { project } = await api("/api/projects", {
      method: "POST",
      body: { name: elements.projectNameInput.value, description: elements.projectDescriptionInput.value },
    });
    elements.createProjectDialog.close();
    elements.createProjectForm.reset();
    showToast(interfaceText(`${project.name} created.`, `Проект ${project.name} создан.`));
    await loadProjects(project.id);
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(elements.createProjectSubmit, false);
  }
}

function localTaskSources(ids) {
  const projectChat = activeProjectChat();
  return state.messages.filter((message) => ids.includes(message.id)).map((message) => ({
    id: message.id,
    telegramChatId: projectChat?.telegram_chats?.telegram_chat_id || String(projectChat?.telegram_chats?.id || ""),
    telegramMessageId: message.telegram_message_id,
    chatTitle: projectChat?.telegram_chats?.title || "Telegram chat",
    senderName: message.sender_name,
    text: message.text,
    sentAt: message.sent_at,
    telegramUrl: message.telegram_url,
  }));
}

function renderTaskSourcePreview(messages) {
  elements.taskSourcePreview.replaceChildren();
  for (const message of messages || []) {
    const item = document.createElement(message.telegramUrl ? "a" : "button");
    item.className = "task-source-preview-item";
    if (message.telegramUrl) {
      item.href = message.telegramUrl;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    } else {
      item.type = "button";
      item.addEventListener("click", () => focusTelegramMessage(message.telegramMessageId));
    }
    const meta = document.createElement("span");
    meta.textContent = `#${message.telegramMessageId || "—"} · ${message.senderName || "Telegram"} · ${formatShortDate(message.sentAt)}`;
    const copy = document.createElement("p");
    copy.textContent = clean(message.text) || interfaceText("Attachment or service message", "Вложение или служебное сообщение");
    item.append(meta, copy);
    elements.taskSourcePreview.append(item);
  }
  if (!elements.taskSourcePreview.childElementCount) {
    const empty = document.createElement("p");
    empty.className = "task-source-preview-empty";
    empty.textContent = interfaceText("Source messages will be attached when the task is created.", "Сообщения-источники будут прикреплены при создании задачи.");
    elements.taskSourcePreview.append(empty);
  }
}

function showPreparedTaskDraft({ ids, title, description, sourceLabel, sourceMessages = [], stats = null, anchorIds = [] }) {
  state.taskDraftSourceIds = ids;
  state.taskDraftAnchorIds = anchorIds;
  state.taskDraftMeta = stats;
  elements.taskDraftLoading.hidden = true;
  elements.taskDraftWorkspace.hidden = false;
  showFormError(elements.taskDraftError, "");
  elements.taskTitleInput.value = title || interfaceText("Follow up from Telegram conversation", "Задача по итогам переписки в Telegram");
  elements.taskDescriptionInput.value = description || "";
  elements.taskSourceSummary.textContent = sourceLabel || interfaceText(
    `${anchorIds.length} anchor${anchorIds.length === 1 ? "" : "s"} → ${ids.length} cited source${ids.length === 1 ? "" : "s"}`,
    `${anchorIds.length} якор${anchorIds.length === 1 ? "ь" : "я"} → ${ids.length} источник${ids.length === 1 ? "" : "ов"}`,
  );
  elements.taskDraftStats.textContent = stats
    ? interfaceText(
      `${stats.scanned} messages scanned · ${stats.candidates} analyzed · ${stats.rangeDays} days · ${stats.model}${stats.syncWarning ? " · history refresh incomplete" : ""}`,
      `Просмотрено ${stats.scanned} · проанализировано ${stats.candidates} · ${stats.rangeDays} дней · ${stats.model}${stats.syncWarning ? " · история обновлена не полностью" : ""}`,
    )
    : interfaceText("Prepared from the source-linked AI answer.", "Подготовлено из AI-ответа со ссылками на источники.");
  elements.taskDraftStats.title = stats?.syncWarning || "";
  elements.taskDraftStats.classList.toggle("warning", Boolean(stats?.syncWarning));
  renderTaskSourcePreview(sourceMessages);
  elements.createTaskSubmit.disabled = false;
  elements.taskTitleInput.focus();
}

async function openTaskDialog({ sourceMessageIds, title, description, sourceLabel } = {}) {
  const ids = sourceMessageIds?.length ? [...new Set(sourceMessageIds)] : [...state.selectedMessageIds];
  if (!ids.length || !state.activeProjectId || !activeProjectChat()) return;
  const requestId = ++state.taskDraftRequestId;
  state.taskDraftSourceIds = null;
  state.taskDraftAnchorIds = ids;
  state.taskDraftMeta = null;
  elements.taskTitleInput.value = "";
  elements.taskDescriptionInput.value = "";
  elements.taskSourceSummary.textContent = interfaceText(`${ids.length} selected anchor${ids.length === 1 ? "" : "s"}`, `Выбрано якорей: ${ids.length}`);
  elements.taskDraftStats.textContent = interfaceText("10 days before the selected anchors", "10 дней до выбранных сообщений");
  renderTaskSourcePreview(localTaskSources(ids));
  elements.taskDraftWorkspace.hidden = Boolean(!title && !description && !sourceLabel);
  elements.taskDraftLoading.hidden = !elements.taskDraftWorkspace.hidden;
  showFormError(elements.taskDraftError, "");
  elements.createTaskSubmit.disabled = true;
  elements.createTaskDialog.showModal();

  if (title || description || sourceLabel) {
    showPreparedTaskDraft({ ids, title, description, sourceLabel, sourceMessages: localTaskSources(ids) });
    return;
  }

  try {
    const result = await api("/api/task-drafts", {
      method: "POST",
      body: {
        projectId: state.activeProjectId,
        chatId: activeProjectChat().telegram_chats.id,
        anchorMessageIds: ids,
        messages: state.messages,
        model: elements.liveModelSelect.value,
        responseLanguage: state.workspace?.project?.response_language || "auto",
      },
    });
    if (requestId !== state.taskDraftRequestId || !elements.createTaskDialog.open) return;
    showPreparedTaskDraft({
      ids: result.sourceMessageIds,
      title: result.title,
      description: result.description,
      sourceMessages: result.sourceMessages,
      stats: result.stats,
      anchorIds: ids,
    });
  } catch (error) {
    if (requestId !== state.taskDraftRequestId || !elements.createTaskDialog.open) return;
    elements.taskDraftLoading.hidden = true;
    elements.taskDraftWorkspace.hidden = true;
    showFormError(elements.taskDraftError, errorMessage(error));
  }
}

async function handleCreateTask(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    state.taskDraftRequestId += 1;
    state.taskDraftSourceIds = null;
    state.taskDraftAnchorIds = null;
    state.taskDraftMeta = null;
    elements.createTaskDialog.close();
    return;
  }
  setLoading(elements.createTaskSubmit, true, interfaceText("Creating…", "Создаём…"));
  try {
    const sourceMessageIds = state.taskDraftSourceIds || [...state.selectedMessageIds];
    const sourceSnapshots = localTaskSources(sourceMessageIds);
    const result = await api(`/api/projects/${state.activeProjectId}/client-tasks`, {
      method: "POST",
      body: {
        title: elements.taskTitleInput.value,
        description: elements.taskDescriptionInput.value,
        sources: sourceSnapshots,
      },
    });
    elements.createTaskDialog.close();
    state.taskDraftSourceIds = null;
    state.taskDraftAnchorIds = null;
    state.taskDraftMeta = null;
    clearSelection();
    showToast(interfaceText(
      `Task “${result.task.title}” created with ${sourceMessageIds.length} source${sourceMessageIds.length === 1 ? "" : "s"}.`,
      `Задача «${result.task.title}» создана. Источников: ${sourceMessageIds.length}.`,
    ));
    state.expandedTaskIds.add(result.task.id);
    await refreshWorkspace({ preserveChat: true });
    setAssistantView("tasks");
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(elements.createTaskSubmit, false);
  }
}

function taskSourceMessages(task) {
  return [...(task.task_sources || [])]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((source) => Array.isArray(source.telegram_messages) ? source.telegram_messages[0] : source.telegram_messages)
    .filter(Boolean);
}

function taskKey(task) {
  return task.external_id || `TH-${clean(task.id).slice(-5).toUpperCase()}`;
}

function createTaskSourceButton(message, telegramMessageId, className = "") {
  const source = document.createElement("button");
  source.type = "button";
  source.className = className;
  source.textContent = `#${telegramMessageId}`;
  if (!message) {
    source.disabled = true;
    source.title = interfaceText(
      "This source message is not available in the project.",
      "Это сообщение-источник недоступно в проекте.",
    );
    return source;
  }
  const chatTitle = message.telegram_chats?.title || interfaceText("source chat", "чате-источнике");
  source.title = `${interfaceText("Open in", "Открыть в")} ${chatTitle} · ${message.sender_name || "Telegram"}: ${clean(message.text).slice(0, 180)}`;
  source.setAttribute("aria-label", interfaceText(
    `Open message #${telegramMessageId} in ${chatTitle}`,
    `Открыть сообщение #${telegramMessageId} в чате ${chatTitle}`,
  ));
  source.addEventListener("click", () => openTaskSource(message));
  return source;
}

function appendTaskInline(container, value, sourcesByTelegramId) {
  const text = String(value || "");
  const citationPattern = /\[#(\d+)\](?:\((https:\/\/[^\s)]+)\))?/g;
  let cursor = 0;
  for (const match of text.matchAll(citationPattern)) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    const telegramId = Number(match[1]);
    const message = sourcesByTelegramId.get(telegramId);
    const citation = createTaskSourceButton(message, telegramId, "task-inline-citation");
    container.append(citation);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function renderTaskDescription(task, sources) {
  const content = document.createElement("div");
  content.className = "task-description-rendered";
  const sourcesByTelegramId = new Map(sources.map((message) => [Number(message.telegram_message_id), message]));
  let list = null;
  for (const rawLine of String(task.description || "").split("\n")) {
    const heading = rawLine.match(/^#{1,3}\s+(.+)/);
    const bullet = rawLine.match(/^\s*[-*]\s+(.+)/);
    if (heading) {
      list = null;
      const title = document.createElement("h4");
      appendTaskInline(title, heading[1], sourcesByTelegramId);
      content.append(title);
      continue;
    }
    if (bullet) {
      if (!list) {
        list = document.createElement("ul");
        content.append(list);
      }
      const item = document.createElement("li");
      appendTaskInline(item, bullet[1], sourcesByTelegramId);
      list.append(item);
      continue;
    }
    list = null;
    if (!rawLine.trim()) continue;
    const paragraph = document.createElement("p");
    appendTaskInline(paragraph, rawLine, sourcesByTelegramId);
    content.append(paragraph);
  }
  return content;
}

function taskMetaText(task, sourceCount) {
  const date = formatShortDate(task.created_at);
  if (task.generation_model) {
    return interfaceText(
      `${task.context_window_days || 10}d context · ${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${date}`,
      `${task.context_window_days || 10} дней · ${sourceCount} источник${sourceCount === 1 ? "" : "ов"} · ${date}`,
    );
  }
  return interfaceText(
    `${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${date}`,
    `${sourceCount} источник${sourceCount === 1 ? "" : "ов"} · ${date}`,
  );
}

function beginTaskEdit(task) {
  if (task.external_url || !canEditProject()) return;
  state.taskEditDrafts.set(task.id, { title: task.title || "", description: task.description || "" });
  state.expandedTaskIds.add(task.id);
  renderTasks();
  requestAnimationFrame(() => {
    const card = [...elements.liveTaskList.children].find((item) => item.dataset.taskId === task.id);
    card?.querySelector(".task-edit-title")?.focus();
  });
}

function cancelTaskEdit(taskId) {
  state.taskEditDrafts.delete(taskId);
  renderTasks();
}

async function updateTaskContent(task, { form, titleInput, descriptionInput, saveButton, cancelButton, error }) {
  titleInput.disabled = true;
  descriptionInput.disabled = true;
  cancelButton.disabled = true;
  setLoading(saveButton, true, interfaceText("Saving…", "Сохраняем…"));
  showFormError(error, "");
  try {
    const result = await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { title: titleInput.value, description: descriptionInput.value },
    });
    Object.assign(task, result.task);
    state.taskEditDrafts.delete(task.id);
    state.expandedTaskIds.add(task.id);
    renderTasks();
    showToast(interfaceText("Task changes saved.", "Изменения задачи сохранены."));
  } catch (requestError) {
    titleInput.disabled = false;
    descriptionInput.disabled = false;
    cancelButton.disabled = false;
    setLoading(saveButton, false);
    showFormError(error, errorMessage(requestError));
    form.classList.add("has-error");
    titleInput.focus();
  }
}

function renderTaskEditor(task) {
  const draft = state.taskEditDrafts.get(task.id) || { title: task.title || "", description: task.description || "" };
  const form = document.createElement("form");
  form.className = "task-inline-editor";

  const titleLabel = document.createElement("label");
  const titleCaption = document.createElement("span");
  titleCaption.textContent = interfaceText("Task title", "Название задачи");
  const titleInput = document.createElement("input");
  titleInput.className = "task-edit-title";
  titleInput.type = "text";
  titleInput.maxLength = 300;
  titleInput.required = true;
  titleInput.value = draft.title;
  titleInput.placeholder = interfaceText("What needs to happen?", "Что нужно сделать?");
  titleLabel.append(titleCaption, titleInput);

  const descriptionLabel = document.createElement("label");
  const descriptionCaption = document.createElement("span");
  descriptionCaption.textContent = interfaceText("Technical specification · Markdown", "Техническое задание · Markdown");
  const descriptionInput = document.createElement("textarea");
  descriptionInput.rows = 16;
  descriptionInput.maxLength = 50_000;
  descriptionInput.value = draft.description;
  descriptionInput.placeholder = interfaceText("Add objectives, requirements, acceptance criteria, and source citations.", "Добавьте цель, требования, критерии приёмки и ссылки на источники.");
  descriptionLabel.append(descriptionCaption, descriptionInput);

  const error = document.createElement("p");
  error.className = "form-error task-editor-error";
  error.setAttribute("role", "alert");
  error.hidden = true;

  const actions = document.createElement("div");
  actions.className = "task-editor-actions";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "live-secondary";
  cancelButton.textContent = interfaceText("Cancel", "Отмена");
  cancelButton.addEventListener("click", () => cancelTaskEdit(task.id));
  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "live-primary";
  saveButton.textContent = interfaceText("Save changes", "Сохранить изменения");
  actions.append(cancelButton, saveButton);

  const rememberDraft = () => state.taskEditDrafts.set(task.id, { title: titleInput.value, description: descriptionInput.value });
  titleInput.addEventListener("input", rememberDraft);
  descriptionInput.addEventListener("input", rememberDraft);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    updateTaskContent(task, { form, titleInput, descriptionInput, saveButton, cancelButton, error });
  });
  form.append(titleLabel, descriptionLabel, error, actions);
  return form;
}

function renderTasks() {
  const tasks = state.workspace?.tasks || [];
  elements.liveTaskList.replaceChildren();
  const taskIds = new Set(tasks.map((task) => task.id));
  for (const taskId of state.taskEditDrafts.keys()) if (!taskIds.has(taskId)) state.taskEditDrafts.delete(taskId);
  for (const task of tasks) {
    if (task.external_url) state.taskEditDrafts.delete(task.id);
    const sources = taskSourceMessages(task);
    const expanded = state.expandedTaskIds.has(task.id);
    const editing = state.taskEditDrafts.has(task.id);
    const card = document.createElement("article");
    card.className = `live-task-card${expanded ? " expanded" : ""}${editing ? " editing" : ""}`;
    card.dataset.taskId = task.id;

    const header = document.createElement("div");
    header.className = "task-card-header";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "task-card-toggle";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-controls", `task-details-${task.id}`);
    toggle.setAttribute("aria-label", interfaceText(
      `${expanded ? "Collapse" : "Expand"} task ${task.title}`,
      `${expanded ? "Свернуть" : "Развернуть"} задачу ${task.title}`,
    ));
    const meta = document.createElement("span");
    meta.className = "task-card-meta";
    const key = document.createElement("b");
    key.textContent = taskKey(task);
    const detail = document.createElement("span");
    detail.textContent = taskMetaText(task, sources.length);
    meta.append(key, detail);
    const title = document.createElement("strong");
    title.textContent = task.title;
    const chevron = document.createElement("i");
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    toggle.append(meta, title, chevron);
    toggle.addEventListener("click", () => {
      if (state.expandedTaskIds.has(task.id)) state.expandedTaskIds.delete(task.id);
      else state.expandedTaskIds.add(task.id);
      renderTasks();
    });

    const status = canEditProject() ? document.createElement("select") : document.createElement("span");
    status.className = "task-status";
    status.dataset.status = task.status;
    status.setAttribute("aria-label", interfaceText(`Status for ${task.title}`, `Статус задачи ${task.title}`));
    if (canEditProject()) {
      const labels = taskStatusLabels();
      for (const [value, label] of Object.entries(labels)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = value === task.status;
        status.append(option);
      }
      status.disabled = editing;
      status.addEventListener("change", () => updateTaskStatus(task, status));
    } else {
      status.textContent = taskStatusLabels()[task.status] || task.status.replace("_", " ");
    }
    header.append(toggle, status);
    card.append(header);

    const details = document.createElement("section");
    details.className = "task-card-details";
    details.id = `task-details-${task.id}`;
    details.hidden = !expanded;

    const detailBar = document.createElement("div");
    detailBar.className = "task-detail-bar";
    const draftState = document.createElement("span");
    draftState.className = `task-draft-state${task.external_url ? " published" : ""}`;
    const draftDot = document.createElement("i");
    draftDot.setAttribute("aria-hidden", "true");
    draftState.append(draftDot, document.createTextNode(task.external_url
      ? interfaceText("Published to Linear", "Опубликовано в Linear")
      : editing
      ? interfaceText("Editing draft", "Редактирование черновика")
      : interfaceText("Draft · editable", "Черновик · можно редактировать")));
    detailBar.append(draftState);
    if (canEditProject() && !task.external_url && !editing) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "task-edit-button";
      editButton.textContent = interfaceText("Edit task", "Редактировать");
      editButton.addEventListener("click", () => beginTaskEdit(task));
      detailBar.append(editButton);
    }
    details.append(detailBar);

    if (editing) details.append(renderTaskEditor(task));
    else if (task.description) details.append(renderTaskDescription(task, sources));
    else {
      const emptyDescription = document.createElement("p");
      emptyDescription.className = "task-description-empty";
      emptyDescription.textContent = interfaceText("No technical specification yet.", "Техническое задание пока пустое.");
      details.append(emptyDescription);
    }

    const footer = document.createElement("footer");
    footer.className = "task-card-footer";
    const sourceArea = document.createElement("div");
    sourceArea.className = "task-source-area";
    if (sources.length) {
      const sourceLabel = document.createElement("span");
      sourceLabel.textContent = interfaceText("Sources", "Источники");
      const sourceList = document.createElement("div");
      sourceList.className = "task-source-links";
      for (const message of sources) {
        const source = createTaskSourceButton(message, message.telegram_message_id);
        sourceList.append(source);
      }
      sourceArea.append(sourceLabel, sourceList);
    }
    footer.append(sourceArea);
    if (editing) {
      const saveHint = document.createElement("span");
      saveHint.className = "task-publish-hint";
      saveHint.textContent = interfaceText("Save changes before publishing", "Сохраните изменения перед публикацией");
      footer.append(saveHint);
    } else if (task.external_url) {
      const external = document.createElement("a");
      external.className = "task-linear-link";
      external.href = task.external_url;
      external.target = "_blank";
      external.rel = "noopener noreferrer";
      external.textContent = `${task.external_id || "Linear"} ↗`;
      footer.append(external);
    } else if (canEditProject() && linearDestinationReady()) {
      const send = document.createElement("button");
      send.type = "button";
      send.className = "task-linear-link";
      send.textContent = interfaceText("Publish to Linear →", "Опубликовать в Linear →");
      send.addEventListener("click", () => sendTaskToLinear(task, send));
      footer.append(send);
    } else if (canEditProject() && linearIntegration()?.status === "connected") {
      const configure = document.createElement("button");
      configure.type = "button";
      configure.className = "task-linear-link";
      configure.textContent = interfaceText("Choose Linear project →", "Выбрать проект Linear →");
      configure.addEventListener("click", () => openProjectSettings());
      footer.append(configure);
    }
    if (sources.length || footer.childElementCount > 1) details.append(footer);
    card.append(details);
    elements.liveTaskList.append(card);
  }
  elements.liveTasksEmpty.hidden = tasks.length > 0;
  elements.liveTaskCount.hidden = tasks.length === 0;
  elements.liveTaskCount.textContent = String(tasks.length);
}

function taskStatusLabels() {
  return {
    open: interfaceText("Open", "Открыта"),
    in_progress: interfaceText("In progress", "В работе"),
    done: interfaceText("Done", "Готова"),
    cancelled: interfaceText("Cancelled", "Отменена"),
  };
}

async function updateTaskStatus(task, select) {
  const previousStatus = task.status;
  select.disabled = true;
  try {
    const result = await api(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: { status: select.value },
    });
    Object.assign(task, result.task);
    renderTasks();
    showToast(interfaceText(`Task marked ${task.status.replace("_", " ")}.`, `Статус задачи: ${taskStatusLabels()[task.status] || task.status}.`));
  } catch (error) {
    select.value = previousStatus;
    select.disabled = false;
    showToast(errorMessage(error));
  }
}

async function openTaskSource(message) {
  const projectChat = state.workspace?.chats?.find((item) => item.telegram_chats.id === message.chat_id);
  if (!projectChat) {
    showToast(interfaceText("The source chat is no longer attached to this project.", "Чат-источник больше не подключён к проекту."));
    return;
  }
  setAssistantDrawerOpen(false, { restoreFocus: false });
  await selectProjectChat(projectChat.id, { sourceId: message.id });
  requestAnimationFrame(() => focusTelegramMessage(message.telegram_message_id));
}

function linearIntegration() {
  return state.workspace?.integrations?.find((integration) => integration.provider === "linear") || null;
}

function linearDestinationReady(integration = linearIntegration()) {
  return Boolean(integration?.status === "connected" && integration.config?.teamId && integration.config?.projectId);
}

function renderLinearDestinationPath(integration = linearIntegration(), pending = false) {
  const selectedTeam = state.linearCatalog?.teams?.find((team) => team.id === elements.linearTeamSelect.value);
  const selectedProject = state.linearCatalog?.projects?.find((project) => project.id === elements.linearProjectSelect.value);
  const teamName = pending ? selectedTeam?.name : integration?.config?.teamName;
  const projectName = pending ? selectedProject?.name : integration?.config?.projectName;
  elements.linearDestinationPath.replaceChildren();
  for (const [index, value] of [integration?.external_workspace_name || "Linear", teamName, projectName].filter(Boolean).entries()) {
    if (index) {
      const divider = document.createElement("i");
      divider.textContent = "›";
      divider.setAttribute("aria-hidden", "true");
      elements.linearDestinationPath.append(divider);
    }
    const segment = document.createElement("span");
    segment.textContent = value;
    elements.linearDestinationPath.append(segment);
  }
  const ready = pending ? Boolean(selectedTeam && selectedProject) : linearDestinationReady(integration);
  elements.linearReadiness.className = `integration-readiness${ready ? " ready" : " action"}`;
  elements.linearReadiness.textContent = ready
    ? interfaceText("Ready to publish", "Готово к публикации")
    : interfaceText("Choose destination", "Выберите назначение");
}

function populateLinearProjectOptions(preferredProjectId = "") {
  const teamId = elements.linearTeamSelect.value;
  const previous = preferredProjectId || elements.linearProjectSelect.value;
  elements.linearProjectSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = interfaceText("Choose project…", "Выберите проект…");
  elements.linearProjectSelect.append(placeholder);
  for (const project of state.linearCatalog?.projects || []) {
    if (!project.teamIds.includes(teamId)) continue;
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = project.id === previous;
    elements.linearProjectSelect.append(option);
  }
  elements.linearProjectSelect.disabled = !canEditProject() || !teamId || elements.linearProjectSelect.options.length === 1;
  renderLinearDestinationPath(linearIntegration(), true);
}

function populateLinearCatalog(catalog) {
  const integration = linearIntegration();
  state.linearCatalog = catalog;
  state.linearCatalogProjectId = state.activeProjectId;
  elements.linearTeamSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = interfaceText("Choose team…", "Выберите команду…");
  elements.linearTeamSelect.append(placeholder);
  for (const team of catalog.teams || []) {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.key ? `${team.name} (${team.key})` : team.name;
    option.selected = team.id === integration?.config?.teamId;
    elements.linearTeamSelect.append(option);
  }
  elements.linearTeamSelect.disabled = !canEditProject();
  populateLinearProjectOptions(integration?.config?.projectId || "");
}

async function loadLinearCatalog() {
  const integration = linearIntegration();
  if (integration?.status !== "connected" || !state.config.linearEnabled) return;
  elements.linearIntegrationStatus.textContent = interfaceText("Loading Linear teams and projects…", "Загружаем команды и проекты Linear…");
  elements.linearTeamSelect.disabled = true;
  elements.linearProjectSelect.disabled = true;
  try {
    const projectId = state.activeProjectId;
    const result = await api(`/api/projects/${projectId}/integrations/linear/catalog`);
    if (state.activeProjectId !== projectId) return;
    populateLinearCatalog(result.catalog);
    elements.linearIntegrationStatus.textContent = linearDestinationReady(integration)
      ? interfaceText("This destination is used whenever a task is published from Telegram Tasks.", "Это назначение используется при каждой публикации задачи из Telegram Tasks.")
      : interfaceText("Connected. Choose the exact team and project for task delivery.", "Подключено. Выберите точную команду и проект для публикации задач.");
  } catch (error) {
    elements.linearIntegrationStatus.textContent = errorMessage(error);
    elements.linearReadiness.className = "integration-readiness action";
    elements.linearReadiness.textContent = interfaceText("Reconnect required", "Нужно переподключить");
  }
}

async function sendTaskToLinear(task, button) {
  setLoading(button, true, interfaceText("Sending…", "Отправляем…"));
  try {
    const result = await api(`/api/tasks/${task.id}/linear`, { method: "POST" });
    Object.assign(task, result.task);
    renderTasks();
    showToast(interfaceText(`${result.issue?.identifier || "Task"} created in Linear.`, `${result.issue?.identifier || "Задача"} создана в Linear.`));
  } catch (error) {
    showToast(errorMessage(error));
    setLoading(button, false);
  }
}

function setAssistantView(view) {
  state.assistantView = view === "tasks" ? "tasks" : "chat";
  elements.assistantChatSurface.hidden = state.assistantView !== "chat";
  elements.assistantTaskSurface.hidden = state.assistantView !== "tasks";
  elements.assistantChatViewButton.classList.toggle("active", state.assistantView === "chat");
  elements.assistantTasksViewButton.classList.toggle("active", state.assistantView === "tasks");
}

async function loadModels() {
  try {
    const [catalog, projectSettings] = await Promise.all([
      fetch("/api/models").then((response) => response.json()),
      state.activeProjectId ? api(`/api/projects/${state.activeProjectId}/ai/settings`) : Promise.resolve(null),
    ]);
    if (catalog.error) throw new Error(catalog.error);
    state.models = catalog.models || [];
    elements.liveModelSelect.replaceChildren();
    const defaultModel = projectSettings?.defaultModel || catalog.defaultModel;
    for (const model of state.models) {
      const option = document.createElement("option");
      option.value = model.apiName;
      option.textContent = model.displayName;
      if (model.apiName === defaultModel) option.selected = true;
      elements.liveModelSelect.append(option);
    }
    elements.liveModelSelect.disabled = state.models.length === 0;
  } catch (error) {
    const unavailable = document.createElement("option");
    unavailable.value = "";
    unavailable.textContent = interfaceText("AI unavailable", "AI недоступен");
    elements.liveModelSelect.replaceChildren(unavailable);
    elements.liveModelSelect.disabled = true;
  }
}

async function createAssistantThread() {
  if (!state.activeProjectId) return null;
  const result = await api(`/api/projects/${state.activeProjectId}/threads`, {
    method: "POST",
    body: { title: "New chat", model: elements.liveModelSelect.value || "" },
  });
  state.workspace.threads.unshift(result.thread);
  state.activeThreadId = result.thread.id;
  state.assistantMessages = [];
  state.pendingAssistantImages = [];
  renderAssistantAttachmentPreview();
  renderThreads();
  renderAssistantMessages();
  return result.thread;
}

function renderThreads() {
  const threads = state.workspace?.threads || [];
  elements.assistantThreadStrip.replaceChildren();
  for (const thread of threads) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `thread-chip${thread.id === state.activeThreadId ? " active" : ""}`;
    button.textContent = thread.title;
    button.addEventListener("click", async () => {
      state.activeThreadId = thread.id;
      renderThreads();
      await loadAssistantMessages(thread.id);
    });
    elements.assistantThreadStrip.append(button);
  }
}

async function loadAssistantMessages(threadId) {
  if (!threadId) {
    state.assistantMessages = [];
    renderAssistantMessages();
    return;
  }
  const result = await api(`/api/projects/${state.activeProjectId}/threads/${threadId}/messages`);
  state.assistantMessages = result.messages || [];
  renderAssistantMessages();
}

function assistantImageGallery(attachments) {
  const gallery = document.createElement("div");
  gallery.className = "assistant-image-gallery";
  for (const attachment of attachments || []) {
    if (!attachment.signed_url) continue;
    const link = document.createElement("a");
    link.href = attachment.signed_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const image = document.createElement("img");
    image.src = attachment.signed_url;
    image.alt = attachment.file_name || "Attached image";
    image.loading = "lazy";
    link.append(image);
    gallery.append(link);
  }
  return gallery;
}

function renderAssistantMessages() {
  elements.assistantLiveMessages.replaceChildren();
  elements.assistantLiveEmpty.hidden = state.assistantMessages.length > 0;
  if (!state.assistantMessages.length) elements.assistantLiveMessages.append(elements.assistantLiveEmpty);
  for (const message of state.assistantMessages) {
    const article = document.createElement("article");
    article.className = `assistant-message ${message.author_kind}`;
    if (message.author_kind === "user") {
      const copy = document.createElement("p");
      copy.textContent = message.content;
      article.append(copy);
      const gallery = assistantImageGallery(message.assistant_message_attachments);
      if (gallery.childElementCount) article.append(gallery);
    } else {
      const byline = document.createElement("div");
      byline.className = "assistant-byline";
      const name = document.createElement("strong");
      name.textContent = "Researcher";
      const model = document.createElement("span");
      model.textContent = message.model || "AI";
      byline.append(name, model);
      const copy = document.createElement("div");
      copy.className = "assistant-copy";
      appendAssistantCopy(copy, message.content);
      article.append(byline, copy, assistantMessageActions(message));
    }
    elements.assistantLiveMessages.append(article);
  }
  requestAnimationFrame(() => { elements.assistantLiveMessages.scrollTop = elements.assistantLiveMessages.scrollHeight; });
}

function renderAssistantAttachmentPreview() {
  elements.assistantAttachmentPreview.replaceChildren();
  for (const [index, image] of state.pendingAssistantImages.entries()) {
    const item = document.createElement("button");
    item.type = "button";
    item.title = interfaceText("Remove image", "Удалить изображение");
    const preview = document.createElement("img");
    preview.src = image.dataUrl;
    preview.alt = image.name;
    const remove = document.createElement("span");
    remove.textContent = "×";
    item.append(preview, remove);
    item.addEventListener("click", () => {
      state.pendingAssistantImages.splice(index, 1);
      renderAssistantAttachmentPreview();
    });
    elements.assistantAttachmentPreview.append(item);
  }
  elements.assistantAttachmentPreview.hidden = state.pendingAssistantImages.length === 0;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve({
      name: file.name,
      mimeType: file.type,
      byteSize: file.size,
      dataUrl: String(reader.result),
      data: String(reader.result).split(",", 2)[1] || "",
    });
    reader.readAsDataURL(file);
  });
}

async function addAssistantImages(files) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  const incoming = [...files];
  if (state.pendingAssistantImages.length + incoming.length > 4) {
    showToast(interfaceText("Attach no more than 4 images.", "Можно прикрепить не более 4 изображений."));
    return;
  }
  if (incoming.some((file) => !allowed.has(file.type) || file.size > 8 * 1024 * 1024)) {
    showToast(interfaceText("Use JPEG, PNG, WebP, or GIF images up to 8 MB each.", "Используйте JPEG, PNG, WebP или GIF до 8 МБ каждый."));
    return;
  }
  const total = [...state.pendingAssistantImages, ...incoming].reduce((bytes, file) => bytes + (file.byteSize || file.size || 0), 0);
  if (total > 12 * 1024 * 1024) {
    showToast(interfaceText("Images must be 12 MB or smaller in total.", "Общий размер изображений не должен превышать 12 МБ."));
    return;
  }
  state.pendingAssistantImages.push(...await Promise.all(incoming.map(readImage)));
  elements.assistantImageInput.value = "";
  renderAssistantAttachmentPreview();
}

function telegramUrlForChat(chat, telegramMessageId) {
  if (!chat || !/^\d+$/.test(String(telegramMessageId))) return "";
  const username = clean(chat.username).replace(/^@/, "");
  if (username) return `https://t.me/${username}/${telegramMessageId}`;
  if (!["supergroup", "channel"].includes(chat.kind)) return "";
  const internalId = clean(chat.telegram_chat_id).replace(/^-100/, "").replace(/^\+/, "");
  return /^\d+$/.test(internalId) ? `https://t.me/c/${internalId}/${telegramMessageId}` : "";
}

function telegramMessageUrl(telegramMessageId) {
  return telegramUrlForChat(activeProjectChat()?.telegram_chats, telegramMessageId);
}

function linkedAssistantMarkdown(message) {
  return String(message.content || "").replace(/\[#(\d+)\](?!\()/g, (citation, telegramId) => {
    const url = telegramMessageUrl(telegramId);
    return url ? `${citation}(${url})` : citation;
  });
}

function assistantTaskTitle(content) {
  const line = String(content || "")
    .split("\n")
    .map((item) => item.replace(/^[-*#\s]+/, "").replace(/\[#\d+\]/g, "").trim())
    .find((item) => item.length >= 8);
  return (line || interfaceText("Follow up from AI research", "Задача по результатам AI-анализа")).slice(0, 300);
}

function downloadAssistantMarkdown(message) {
  const thread = state.workspace?.threads?.find((item) => item.id === message.thread_id);
  const markdown = [
    `# ${thread?.title || "Telegram Tasks research"}`,
    `- Project: ${state.workspace?.project?.name || ""}`,
    `- Chat: ${activeProjectChat()?.telegram_chats?.title || ""}`,
    `- Model: ${message.model || "AI"}`,
    `- Generated: ${message.created_at || new Date().toISOString()}`,
    "",
    linkedAssistantMarkdown(message),
    "",
  ].join("\n");
  const blobUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${(thread?.title || "thread-research").replace(/[^\p{L}\p{N}._-]+/gu, "-").toLowerCase()}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
}

function assistantMessageActions(message) {
  const actions = document.createElement("div");
  actions.className = "assistant-live-actions";
  const addAction = (label, handler, className = "") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", handler);
    actions.append(button);
  };
  addAction(interfaceText("Copy", "Копировать"), async () => {
    await navigator.clipboard.writeText(message.content);
    showToast(interfaceText("Answer copied.", "Ответ скопирован."));
  });
  addAction(interfaceText("Download .md", "Скачать .md"), () => downloadAssistantMarkdown(message));
  const citedTelegramIds = (message.assistant_citations || [])
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((citation) => citation.telegram_message_id)
    .filter(Boolean);
  const citedSet = new Set(citedTelegramIds.map(Number));
  const sourceIds = state.messages
    .filter((candidate) => citedSet.has(Number(candidate.telegram_message_id)))
    .map((candidate) => candidate.id);
  if (canEditProject() && sourceIds.length) {
    addAction(interfaceText("Create task", "Создать задачу"), () => openTaskDialog({
      sourceMessageIds: sourceIds,
      title: assistantTaskTitle(message.content),
      description: linkedAssistantMarkdown(message),
      sourceLabel: interfaceText(
        `${sourceIds.length} Telegram citation${sourceIds.length === 1 ? "" : "s"} from this AI answer.`,
        `${sourceIds.length} Telegram-${sourceIds.length === 1 ? "источник" : "источника"} из этого AI-ответа.`,
      ),
    }), "task-action");
  }
  return actions;
}

function appendAssistantCopy(container, value) {
  const lines = String(value || "").split("\n");
  let list = null;
  for (const rawLine of lines) {
    const bullet = rawLine.match(/^\s*[-*]\s+(.+)/);
    if (bullet) {
      if (!list) {
        list = document.createElement("ul");
        container.append(list);
      }
      const item = document.createElement("li");
      appendAssistantInline(item, bullet[1]);
      list.append(item);
      continue;
    }
    list = null;
    if (!rawLine.trim()) {
      container.append(document.createElement("br"));
      continue;
    }
    const block = document.createElement(rawLine.match(/^\s*#{1,3}\s+/) ? "strong" : "p");
    appendAssistantInline(block, rawLine.replace(/^\s*#{1,3}\s+/, ""));
    container.append(block);
  }
}

function appendAssistantInline(container, value) {
  const text = String(value || "");
  const pattern = /(\[#(\d+)\])(?:\((https?:\/\/[^\s)]+)\))?|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|`([^`]+)`|(https?:\/\/[^\s<]+)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    container.append(document.createTextNode(text.slice(lastIndex, match.index)));
    if (match[2]) {
      const telegramId = match[2];
      const citation = document.createElement("button");
      citation.type = "button";
      citation.className = "citation-link";
      citation.textContent = match[1];
      citation.setAttribute("aria-label", interfaceText(`Open message #${telegramId} in this chat`, `Открыть сообщение #${telegramId} в этом чате`));
      citation.addEventListener("click", () => focusTelegramMessage(telegramId));
      container.append(citation);
    } else if (match[4] && match[5]) {
      const link = document.createElement("a");
      link.href = match[5];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[4];
      container.append(link);
    } else if (match[6]) {
      const code = document.createElement("code");
      code.textContent = match[6];
      container.append(code);
    } else if (match[7]) {
      const link = document.createElement("a");
      link.href = match[7];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = match[7];
      container.append(link);
    }
    lastIndex = match.index + match[0].length;
  }
  container.append(document.createTextNode(text.slice(lastIndex)));
}

function updateAssistantAvailability() {
  const enabled = Boolean(state.activeProjectId && state.activeProjectChatId && state.messages.length);
  elements.assistantLiveInput.disabled = !enabled;
  elements.assistantLiveSend.disabled = !enabled;
  elements.assistantAttachButton.disabled = !enabled;
  elements.assistantLiveInput.placeholder = enabled
    ? interfaceText("Ask about this project chat…", "Спросите по чату проекта…")
    : interfaceText("Choose a project chat first…", "Сначала выберите чат проекта…");
}

async function handleAssistantSubmit(event) {
  event.preventDefault();
  const question = elements.assistantLiveInput.value.trim() || (state.pendingAssistantImages.length
    ? interfaceText("Analyze the attached image in the context of this project chat.", "Проанализируй прикреплённое изображение в контексте чата проекта.")
    : "");
  if (!question || !state.activeProjectId || !state.activeProjectChatId) return;
  const pendingImages = [...state.pendingAssistantImages];
  elements.assistantLiveInput.value = "";
  elements.assistantLiveInput.style.height = "auto";
  elements.assistantLiveSend.disabled = true;
  try {
    if (!state.activeThreadId) await createAssistantThread();
    state.assistantMessages.push({
      id: `optimistic-${Date.now()}`,
      author_kind: "user",
      content: question,
      created_at: new Date().toISOString(),
      assistant_message_attachments: pendingImages.map((image) => ({ file_name: image.name, signed_url: image.dataUrl })),
    });
    renderAssistantMessages();
    const projectChat = activeProjectChat();
    const result = await api(`/api/projects/${state.activeProjectId}/threads/${state.activeThreadId}/ask`, {
      method: "POST",
      body: {
        question,
        model: elements.liveModelSelect.value,
        chatId: projectChat.telegram_chats.id,
        responseLanguage: state.workspace.project.response_language,
        context: { messages: state.messages },
        attachments: pendingImages.map((image) => ({ name: image.name, mimeType: image.mimeType, data: image.data })),
      },
    });
    state.pendingAssistantImages = [];
    renderAssistantAttachmentPreview();
    await loadAssistantMessages(state.activeThreadId);
    if (result.threadTitle) {
      const thread = state.workspace.threads.find((item) => item.id === state.activeThreadId);
      if (thread) thread.title = result.threadTitle;
      renderThreads();
    }
  } catch (error) {
    showToast(errorMessage(error));
    await loadAssistantMessages(state.activeThreadId).catch(() => {});
  } finally {
    updateAssistantAvailability();
  }
}

function populateProjectSettings() {
  if (!state.workspace) return;
  elements.projectInstructionsInput.value = state.workspace.instructions?.instructions || "";
  elements.projectResponseLanguage.value = state.workspace.project.response_language || "auto";
  elements.interfaceLanguageSelect.value = state.preferences.interfaceLanguage;
  elements.themeSelect.value = state.preferences.theme;
  elements.projectMemberList.replaceChildren();
  for (const member of state.workspace.members || []) {
    const row = document.createElement("div");
    const identity = document.createElement("span");
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    identity.textContent = profile?.display_name || profile?.email || interfaceText("Member", "Участник");
    const role = document.createElement("small");
    role.textContent = {
      owner: interfaceText("owner", "владелец"),
      editor: interfaceText("editor", "редактор"),
      viewer: interfaceText("viewer", "наблюдатель"),
    }[member.role] || member.role;
    row.append(identity, role);
    elements.projectMemberList.append(row);
  }
  const isOwner = state.workspace.project.owner_id === state.user.id;
  const canEdit = canEditProject();
  elements.projectInviteRow.hidden = !isOwner;
  elements.projectInviteResult.hidden = true;
  elements.projectInviteEmail.value = "";
  elements.projectInstructionsInput.readOnly = !canEdit;
  elements.projectResponseLanguage.disabled = !canEdit;
  elements.saveProjectSettings.hidden = false;
  const integration = linearIntegration();
  elements.linearIntegrationSection.hidden = false;
  elements.connectLinearButton.hidden = !isOwner;
  elements.connectLinearButton.disabled = !state.config.linearEnabled;
  elements.connectLinearButton.textContent = integration?.status === "connected"
    ? interfaceText("Reconnect workspace", "Переподключить пространство")
    : interfaceText("Connect Linear", "Подключить Linear");
  elements.linearTeamSelect.replaceChildren();
  elements.linearProjectSelect.replaceChildren();
  if (integration?.status === "connected") {
    elements.linearIntegrationStatus.textContent = interfaceText(
      linearDestinationReady(integration)
        ? "This destination is used whenever a task is published from Telegram Tasks."
        : `Connected to ${integration.external_workspace_name || "Linear"}. Choose a destination.`,
      linearDestinationReady(integration)
        ? "Это назначение используется при каждой публикации задачи из Telegram Tasks."
        : `Подключено к ${integration.external_workspace_name || "Linear"}. Выберите назначение.`,
    );
    elements.linearDestination.hidden = false;
    elements.linearTeamLabel.hidden = !isOwner;
    elements.linearProjectLabel.hidden = !isOwner;
    if (integration.config?.teamId) {
      elements.linearTeamSelect.append(new Option(integration.config.teamName || integration.config.teamKey || "Selected team", integration.config.teamId, true, true));
    }
    if (integration.config?.projectId) {
      elements.linearProjectSelect.append(new Option(integration.config.projectName || "Selected project", integration.config.projectId, true, true));
    }
    renderLinearDestinationPath(integration);
  } else {
    elements.linearDestination.hidden = true;
    elements.linearIntegrationStatus.textContent = !state.config.linearEnabled
      ? interfaceText("Linear MCP is temporarily unavailable.", "Linear MCP временно недоступен.")
      : integration?.status === "error"
      ? integration.last_error || interfaceText("Linear needs to be reconnected.", "Нужно переподключить Linear.")
      : interfaceText("Connect a Linear workspace to send source-linked tasks.", "Подключите Linear, чтобы отправлять задачи со ссылками на источники.");
    elements.linearTeamLabel.hidden = true;
    elements.linearProjectLabel.hidden = true;
    elements.linearReadiness.className = "integration-readiness";
    elements.linearReadiness.textContent = state.config.linearEnabled
      ? interfaceText("Not connected", "Не подключено")
      : interfaceText("MCP unavailable", "MCP недоступен");
  }
}

async function createProjectInvite() {
  const email = elements.projectInviteEmail.value.trim();
  if (!email || !state.activeProjectId) return;
  setLoading(elements.createInviteButton, true, interfaceText("Creating…", "Создаём…"));
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/invites`, {
      method: "POST",
      body: { email, role: elements.projectInviteRole.value },
    });
    elements.projectInviteLink.value = result.inviteUrl;
    elements.projectInviteResult.hidden = false;
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(elements.createInviteButton, false);
  }
}

function localArchiveTasks() {
  try {
    const workspaces = JSON.parse(localStorage.getItem("thread.assistant-workspaces.v1") || "{}");
    if (!workspaces || typeof workspaces !== "object" || Array.isArray(workspaces)) return [];
    return Object.entries(workspaces).flatMap(([workspaceKey, workspace]) => (Array.isArray(workspace?.tasks) ? workspace.tasks : []).map((task, index) => ({
      legacyImportId: `${workspaceKey}:${clean(task?.id) || index}`,
      title: clean(task?.title) || interfaceText("Imported archive task", "Импортированная задача архива"),
      description: [clean(task?.excerpt), task?.sourceMessageId ? `Archive source: ${clean(task.sourceMessageId)}` : ""].filter(Boolean).join("\n\n"),
      createdAt: Number.isFinite(Date.parse(task?.createdAt)) ? Date.parse(task.createdAt) : undefined,
    })));
  } catch {
    return [];
  }
}

async function migrateLocalData() {
  if (!state.activeProjectId) return;
  const tasks = localArchiveTasks();
  setLoading(elements.migrateLocalButton, true, interfaceText("Importing…", "Импортируем…"));
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/migrate-local`, { method: "POST", body: { tasks } });
    elements.migrationStatus.textContent = interfaceText(
      `Imported ${result.imported}; already present ${result.skipped}.`,
      `Импортировано: ${result.imported}; уже было: ${result.skipped}.`,
    );
    showToast(interfaceText("Local data import complete.", "Импорт локальных данных завершён."));
    await refreshWorkspace({ preserveChat: true });
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(elements.migrateLocalButton, false);
  }
}

async function handleProjectSettings(event) {
  event.preventDefault();
  if (event.submitter?.value === "cancel") {
    elements.projectSettingsDialog.close();
    return;
  }
  savePreferences();
  if (!canEditProject()) {
    elements.projectSettingsDialog.close();
    showToast(state.preferences.interfaceLanguage === "ru" ? "Настройки сохранены." : "Preferences saved.");
    return;
  }
  setLoading(elements.saveProjectSettings, true, interfaceText("Saving…", "Сохраняем…"));
  try {
    const instructions = elements.projectInstructionsInput.value.trim();
    await api(`/api/projects/${state.activeProjectId}`, {
      method: "PATCH",
      body: { instructions, responseLanguage: elements.projectResponseLanguage.value },
    });
    const integration = linearIntegration();
    if (integration?.status === "connected" && state.workspace.project.owner_id === state.user.id) {
      if (!elements.linearTeamSelect.value || !elements.linearProjectSelect.value) {
        throw new Error(interfaceText("Choose a Linear team and project before saving.", "Перед сохранением выберите команду и проект Linear."));
      }
      if (elements.linearTeamSelect.value !== integration.config?.teamId || elements.linearProjectSelect.value !== integration.config?.projectId) {
        await api(`/api/projects/${state.activeProjectId}/integrations/linear`, {
          method: "PATCH",
          body: { teamId: elements.linearTeamSelect.value, projectId: elements.linearProjectSelect.value },
        });
      }
    }
    elements.projectSettingsDialog.close();
    showToast(interfaceText("Project settings saved.", "Настройки проекта сохранены."));
    await refreshWorkspace({ preserveChat: true });
  } catch (error) {
    showToast(errorMessage(error));
  } finally {
    setLoading(elements.saveProjectSettings, false);
  }
}

async function initialize() {
  try {
    state.config = await fetch("/api/platform/config").then((response) => response.json());
    if (!state.config.enabled) {
      window.location.replace("/index.html");
      return;
    }
    const session = await api("/api/auth/session").catch((error) => error.status === 401 ? null : Promise.reject(error));
    state.user = session?.user || null;
    if (state.user) {
      await enterWorkspace();
    } else {
      showAuth();
      const params = new URLSearchParams(window.location.search);
      if (params.get("telegramAuth") === "error") {
        showFormError(elements.authError, params.get("message") || "Telegram sign-in failed.");
      }
    }
  } catch (error) {
    showAuth();
    showFormError(elements.authError, interfaceText(`Telegram Tasks could not start: ${errorMessage(error)}`, `Не удалось запустить Telegram Tasks: ${errorMessage(error)}`));
  }
}

elements.authSubmit.addEventListener("click", handleAuthSubmit);
elements.signOutButton.addEventListener("click", async () => {
  await api("/api/auth/signout", { method: "POST" });
  state.user = null;
  resetProjectView();
  showAuth();
});
elements.newProjectButton.addEventListener("click", () => {
  elements.createProjectForm.reset();
  elements.createProjectDialog.showModal();
  elements.projectNameInput.focus();
});
elements.createProjectForm.addEventListener("submit", handleCreateProject);
elements.connectTelegramButton.addEventListener("click", openTelegramDialog);
elements.emptyConnectButton.addEventListener("click", async () => {
  if (state.activeProjectChatId) await refreshMessages();
  else if (state.activeProjectId && state.connections.some((connection) => connection.status === "connected")) await openAddChatDialog();
  else await openTelegramDialog();
});
elements.telegramForm.addEventListener("submit", handleTelegramSubmit);
elements.addChatButton.addEventListener("click", openAddChatDialog);
elements.addChatForm.addEventListener("submit", (event) => { event.preventDefault(); elements.addChatDialog.close(); });
elements.addChatSearch.addEventListener("input", renderAvailableChats);
elements.refreshMessagesButton.addEventListener("click", refreshMessages);
elements.telegramMessageComposer.addEventListener("submit", handleTelegramMessageSubmit);
elements.telegramMessageInput.addEventListener("input", () => {
  if (state.activeProjectChatId) {
    if (clean(elements.telegramMessageInput.textContent)) state.telegramDrafts.set(state.activeProjectChatId, elements.telegramMessageInput.innerHTML);
    else state.telegramDrafts.delete(state.activeProjectChatId);
  }
  updateTelegramComposerAvailability();
});
elements.telegramMessageInput.addEventListener("paste", (event) => {
  event.preventDefault();
  document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") || "");
});
elements.telegramMessageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.telegramMessageComposer.requestSubmit();
  } else if (event.key === "Escape" && !elements.telegramFormatToolbar.hidden) {
    event.preventDefault();
    setTelegramFormattingOpen(false);
  } else if (event.key === "Escape" && state.telegramReplyMessage) {
    event.preventDefault();
    clearTelegramReply();
  }
});
elements.telegramReplyCancel.addEventListener("click", clearTelegramReply);
elements.telegramFormatToggle.addEventListener("mousedown", (event) => event.preventDefault());
elements.telegramFormatToggle.addEventListener("click", () => {
  setTelegramFormattingOpen(elements.telegramFormatToolbar.hidden);
  elements.telegramMessageInput.focus();
});
elements.telegramFormatButtons.forEach((button) => {
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => applyTelegramComposerFormat(button.dataset.telegramFormat));
});
document.addEventListener("click", (event) => {
  if (!elements.telegramFormatToolbar.hidden && !elements.telegramComposerShell.contains(event.target)) {
    setTelegramFormattingOpen(false);
  }
});
elements.clearSelectionButton.addEventListener("click", clearSelection);
elements.createTaskFromSelectionButton.addEventListener("click", openTaskDialog);
elements.createTaskForm.addEventListener("submit", handleCreateTask);
elements.assistantChatViewButton.addEventListener("click", () => setAssistantView("chat"));
elements.assistantTasksViewButton.addEventListener("click", () => setAssistantView("tasks"));
elements.newAssistantThreadButton.addEventListener("click", () => createAssistantThread().catch((error) => showToast(errorMessage(error))));
elements.assistantLiveForm.addEventListener("submit", handleAssistantSubmit);
elements.assistantAttachButton.addEventListener("click", () => elements.assistantImageInput.click());
elements.assistantImageInput.addEventListener("change", () => addAssistantImages(elements.assistantImageInput.files).catch((error) => showToast(errorMessage(error))));
elements.assistantLiveInput.addEventListener("input", () => {
  elements.assistantLiveInput.style.height = "auto";
  elements.assistantLiveInput.style.height = `${Math.min(elements.assistantLiveInput.scrollHeight, 160)}px`;
});
elements.assistantLiveInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    elements.assistantLiveForm.requestSubmit();
  }
});
async function openProjectSettings() {
  populateProjectSettings();
  elements.projectSettingsDialog.showModal();
  await loadLinearCatalog();
}
elements.projectSettingsButton.addEventListener("click", openProjectSettings);
elements.projectSettingsForm.addEventListener("submit", handleProjectSettings);
elements.createInviteButton.addEventListener("click", createProjectInvite);
elements.migrateLocalButton.addEventListener("click", migrateLocalData);
elements.copyInviteButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(elements.projectInviteLink.value);
  showToast(interfaceText("Invitation link copied.", "Ссылка-приглашение скопирована."));
});
elements.connectLinearButton.addEventListener("click", async () => {
  setLoading(elements.connectLinearButton, true, interfaceText("Opening…", "Открываем…"));
  try {
    const result = await api(`/api/projects/${state.activeProjectId}/integrations/linear/connect`, { method: "POST" });
    window.location.assign(result.authorizeUrl);
  } catch (error) {
    showToast(errorMessage(error));
    setLoading(elements.connectLinearButton, false);
  }
});
elements.linearTeamSelect.addEventListener("change", () => populateLinearProjectOptions());
elements.linearProjectSelect.addEventListener("change", () => renderLinearDestinationPath(linearIntegration(), true));
elements.mobileRailButton.addEventListener("click", () => elements.liveApp.classList.toggle("rail-open"));
elements.openAssistantDrawerButton.addEventListener("click", () => {
  setAssistantDrawerOpen(!elements.liveApp.classList.contains("assistant-drawer-open"));
});
elements.closeAssistantDrawerButton.addEventListener("click", () => setAssistantDrawerOpen(false));
elements.assistantDrawerBackdrop.addEventListener("click", () => setAssistantDrawerOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.liveApp.classList.contains("assistant-drawer-open")) {
    event.preventDefault();
    setAssistantDrawerOpen(false);
  }
});

loadPreferences();
initialize();
