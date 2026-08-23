# Telegram Tasks interface system

## Product model

- A Telegram chat is the primary workspace and task stream. The user should not have to create or select a separate project before working.
- The active Telegram chat supplies task context and is the default scope for the recent-task list.
- Tasks created from a chat retain the Telegram chat identifier in `client_sources.telegram_chat_id` so the source remains traceable when the task is sent to Linear.
- Linear connection, Linear destination, and AI model settings are shared account-level settings. Do not repeat them per chat.
- Project creation, project switching, invitations, roles, member management, and placeholder users are outside the current product surface.
- The legacy project record may remain as a hidden compatibility container, but it must not appear as a user-facing concept or prerequisite.

## Workspace hierarchy

- The current Telegram chat is the page context and should be named explicitly near the top of the workspace.
- Creating a task is the focal action.
- Linear connection and destination are supporting configuration.
- Recent tasks are filtered to the current chat and provide continuity after creation.
- AI assistance uses the same global settings regardless of which chat is active.

## Interaction rules

- Opening the task workspace must not stop on a project picker or project-creation empty state.
- Switching Telegram chats switches visible task context; it must not create a new settings scope.
- Task creation may work before Linear is connected. Publishing to Linear is a separate explicit action.
- Do not ask users to invite or assign synthetic members as part of setup.
- If project concepts return later, introduce them only after their ownership, settings inheritance, and relationship to Telegram chats are explicitly defined.

## Visual continuity

- Keep the existing Telegram-derived palette, typography, spacing, and border treatment.
- Show chat context as compact orientation, not as another heavy settings card.
- Use text hierarchy and spacing before introducing additional containers or navigation.
