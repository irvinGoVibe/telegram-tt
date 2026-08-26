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

## macOS window chrome

- In regular and native-fullscreen Tauri windows, do not render or reserve a full-width titlebar, background strip, border, margin, or fixed-column offset. The Telegram interface uses the full viewport height.
- In a regular window, native macOS traffic-light controls overlay the top-left corner. Reserve their `2.5rem` vertical zone only inside the folder sidebar; when that sidebar is hidden, headers reserve horizontal space through `--window-controls-width`.
- Leave fullscreen window controls to the native macOS top-edge reveal behavior. Do not imitate the traffic-light controls inside the Telegram interface.
- Every fixed column and drawer, including the AI drawer, occupies the full viewport height and does not inherit a titlebar top offset.

## Interface styles

- The product supports two interface styles: `islands` and `classic`. This choice changes layout presentation, not the color theme.
- Components, state, behavior, localization, and business logic are shared between both styles. Implement functional changes once; do not duplicate Teact component trees or actions per style.
- `islands` is the default presentation. Put shared styling in the component's base SCSS and keep only genuine classic differences under `html.interface-style-classic`.
- The classic style uses contiguous desktop columns, full-width rectangular chat headers and header panes, and the legacy message composer pattern with a separate input bubble and circular action button.
- Classic-only layout rules apply from `min-width: 601px`. Mobile presentation stays shared unless a task explicitly requests a mobile distinction.
- Persist the selected style in shared settings and apply it through the root HTML class. Do not couple interface style to light or dark theme selection.
- After changing shared UI or layout CSS, verify both styles. For chat geometry, check the normal view and the view with the right column open; do not report visual completion from lint alone.
