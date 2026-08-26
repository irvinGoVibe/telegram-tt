import {
  memo, useCallback, useMemo, useState,
} from '../../lib/teact/teact';

import buildClassName from '../../util/buildClassName';

import useLang from '../../hooks/useLang';
import useLastCallback from '../../hooks/useLastCallback';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import DropdownMenu from '../ui/DropdownMenu';
import MenuItem from '../ui/MenuItem';
import MenuSeparator from '../ui/MenuSeparator';
import Modal from '../ui/Modal';

import styles from './ThreadAssistantSkills.module.scss';

const CUSTOM_SKILLS_STORAGE_KEY = 'telegram-thread.ai-custom-skills';
const MAX_ACTIVE_SKILLS = 5;
const MAX_CUSTOM_SKILLS = 50;
const MAX_SKILL_TITLE_LENGTH = 60;
const MAX_SKILL_DESCRIPTION_LENGTH = 160;
const MAX_SKILL_INSTRUCTIONS_LENGTH = 4000;

export type ThreadAssistantSkill = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  isCustom?: boolean;
};

type OwnProps = {
  skills: ThreadAssistantSkill[];
  isDisabled?: boolean;
  onChange: (skills: ThreadAssistantSkill[]) => void;
};

type ModalView = 'library' | 'create';

function createCustomSkillId() {
  return `custom:${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cleanStoredString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function parseCustomSkill(value: unknown): ThreadAssistantSkill | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const skill = value as Record<string, unknown>;
  const title = cleanStoredString(skill.title, MAX_SKILL_TITLE_LENGTH).trim();
  const instructions = cleanStoredString(skill.instructions, MAX_SKILL_INSTRUCTIONS_LENGTH).trim();
  if (!title || !instructions) return undefined;

  return {
    id: cleanStoredString(skill.id, MAX_SKILL_TITLE_LENGTH) || createCustomSkillId(),
    title,
    description: cleanStoredString(skill.description, MAX_SKILL_DESCRIPTION_LENGTH).trim(),
    instructions,
    isCustom: true,
  };
}

function readCustomSkills(): ThreadAssistantSkill[] {
  try {
    const value = JSON.parse(localStorage.getItem(CUSTOM_SKILLS_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return [];

    return value.slice(-MAX_CUSTOM_SKILLS).map(parseCustomSkill).filter(Boolean);
  } catch {
    return [];
  }
}

function saveCustomSkills(skills: ThreadAssistantSkill[]) {
  try {
    localStorage.setItem(CUSTOM_SKILLS_STORAGE_KEY, JSON.stringify(skills.slice(-MAX_CUSTOM_SKILLS)));
  } catch {
    // Keep the current session usable when browser storage is unavailable
  }
}

const ThreadAssistantSkills = ({ skills, isDisabled, onChange }: OwnProps) => {
  const lang = useLang();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('library');
  const [customSkills, setCustomSkills] = useState<ThreadAssistantSkill[]>(() => readCustomSkills());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const presetSkills: ThreadAssistantSkill[] = [
    {
      id: 'preset:telegram-summary',
      title: lang('ThreadAISkillSummaryTitle'),
      description: lang('ThreadAISkillSummaryDescription'),
      instructions: lang('ThreadAISkillSummaryInstructions'),
    },
    {
      id: 'preset:action-items',
      title: lang('ThreadAISkillActionsTitle'),
      description: lang('ThreadAISkillActionsDescription'),
      instructions: lang('ThreadAISkillActionsInstructions'),
    },
    {
      id: 'preset:draft-reply',
      title: lang('ThreadAISkillReplyTitle'),
      description: lang('ThreadAISkillReplyDescription'),
      instructions: lang('ThreadAISkillReplyInstructions'),
    },
    {
      id: 'preset:product-brief',
      title: lang('ThreadAISkillBriefTitle'),
      description: lang('ThreadAISkillBriefDescription'),
      instructions: lang('ThreadAISkillBriefInstructions'),
    },
  ];
  const activeSkillIds = useMemo(() => new Set(skills.map(({ id }) => id)), [skills]);

  const resetForm = useLastCallback(() => {
    setTitle('');
    setDescription('');
    setInstructions('');
  });

  const openLibrary = useLastCallback(() => {
    setModalView('library');
    setIsModalOpen(true);
  });

  const openCreate = useLastCallback(() => {
    resetForm();
    setModalView('create');
    setIsModalOpen(true);
  });

  const closeModal = useLastCallback(() => {
    setIsModalOpen(false);
  });

  const toggleSkill = useLastCallback((skill: ThreadAssistantSkill) => {
    if (activeSkillIds.has(skill.id)) {
      onChange(skills.filter(({ id }) => id !== skill.id));
      return;
    }
    if (skills.length >= MAX_ACTIVE_SKILLS) return;
    onChange([...skills, skill]);
  });

  const deleteCustomSkill = useLastCallback((skillId: string) => {
    const nextCustomSkills = customSkills.filter(({ id }) => id !== skillId);
    setCustomSkills(nextCustomSkills);
    saveCustomSkills(nextCustomSkills);
    if (activeSkillIds.has(skillId)) {
      onChange(skills.filter(({ id }) => id !== skillId));
    }
  });

  const createSkill = useLastCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextInstructions = instructions.trim();
    if (!nextTitle || !nextInstructions) return;

    const skill: ThreadAssistantSkill = {
      id: createCustomSkillId(),
      title: nextTitle,
      description: description.trim(),
      instructions: nextInstructions,
      isCustom: true,
    };
    const nextCustomSkills = [...customSkills, skill].slice(-MAX_CUSTOM_SKILLS);
    setCustomSkills(nextCustomSkills);
    saveCustomSkills(nextCustomSkills);
    if (skills.length < MAX_ACTIVE_SKILLS) onChange([...skills, skill]);
    resetForm();
    setModalView('library');
  });

  const renderTrigger = useCallback(({ onTrigger, isOpen }: { onTrigger: NoneToVoidFunction; isOpen?: boolean }) => (
    <Button
      color="translucent"
      size="smaller"
      className={buildClassName(styles.trigger, isOpen && styles.triggerActive)}
      ariaLabel={lang('ThreadAISkills')}
      hasPopup
      disabled={isDisabled}
      noForcedUpperCase
      onClick={onTrigger}
    >
      <Icon name="tools" className={styles.triggerIcon} />
      <span className={styles.triggerLabel}>{lang('ThreadAISkills')}</span>
      {Boolean(skills.length) && <span className={styles.triggerCount}>{skills.length}</span>}
      <Icon name="down" className={styles.triggerChevron} />
    </Button>
  ), [isDisabled, lang, skills.length]);

  const renderSkillCard = (skill: ThreadAssistantSkill) => {
    const isAttached = activeSkillIds.has(skill.id);
    const isAtLimit = !isAttached && skills.length >= MAX_ACTIVE_SKILLS;

    return (
      <article key={skill.id} className={styles.skillCard}>
        <span className={styles.skillIcon}>
          <Icon name={skill.isCustom ? 'tools' : 'bot-command'} />
        </span>
        <div className={styles.skillCopy}>
          <strong className={styles.skillTitle}>{skill.title}</strong>
          <p className={styles.skillDescription}>{skill.description}</p>
        </div>
        <div className={styles.skillActions}>
          {skill.isCustom && (
            <Button
              round
              color="translucent"
              size="tiny"
              className={styles.deleteButton}
              ariaLabel={lang('ThreadAIDeleteSkill')}
              iconName="delete"
              onClick={() => deleteCustomSkill(skill.id)}
            />
          )}
          <Button
            color={isAttached ? 'translucent-primary' : 'secondary'}
            size="smaller"
            className={styles.attachButton}
            ariaLabel={isAtLimit ? lang('ThreadAISkillsLimit') : undefined}
            disabled={isAtLimit}
            noForcedUpperCase
            onClick={() => toggleSkill(skill)}
          >
            {lang(isAttached ? 'ThreadAISkillAttached' : 'ThreadAIAttachSkill')}
          </Button>
        </div>
      </article>
    );
  };

  const renderLibrary = () => (
    <div className={styles.library}>
      <div className={styles.intro}>
        <div className={styles.introCopy}>
          <h3 className={styles.heading}>{lang('ThreadAISkillsLibraryTitle')}</h3>
          <p className={styles.description}>{lang('ThreadAISkillsLibraryDescription')}</p>
        </div>
        <Button
          className={styles.createButton}
          color="primary"
          size="smaller"
          iconName="add"
          noForcedUpperCase
          onClick={openCreate}
        >
          {lang('ThreadAICreateSkill')}
        </Button>
      </div>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <strong className={styles.sectionTitle}>{lang('ThreadAISkillTemplates')}</strong>
          <span>{lang('ThreadAISkillsAttachedCount', { count: skills.length })}</span>
        </div>
        <div className={styles.skillGrid}>{presetSkills.map(renderSkillCard)}</div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <strong className={styles.sectionTitle}>{lang('ThreadAIMySkills')}</strong>
        </div>
        {customSkills.length
          ? <div className={styles.skillGrid}>{customSkills.map(renderSkillCard)}</div>
          : <p className={styles.empty}>{lang('ThreadAINoCustomSkills')}</p>}
      </section>
      {skills.length >= MAX_ACTIVE_SKILLS && (
        <p className={styles.limitNotice}>{lang('ThreadAISkillsLimit')}</p>
      )}
    </div>
  );

  const renderCreate = () => (
    <form className={styles.createForm} onSubmit={createSkill}>
      <div className={styles.createHeading}>
        <Button
          round
          color="translucent"
          size="tiny"
          ariaLabel={lang('Back')}
          iconName="arrow-left"
          onClick={() => setModalView('library')}
        />
        <div>
          <h3 className={styles.heading}>{lang('ThreadAICreateSkill')}</h3>
          <p className={styles.description}>{lang('ThreadAICreateSkillDescription')}</p>
        </div>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{lang('ThreadAISkillName')}</span>
        <input
          className={styles.fieldInput}
          type="text"
          value={title}
          maxLength={MAX_SKILL_TITLE_LENGTH}
          autoFocus
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{lang('ThreadAISkillDescription')}</span>
        <input
          className={styles.fieldInput}
          type="text"
          value={description}
          maxLength={MAX_SKILL_DESCRIPTION_LENGTH}
          placeholder={lang('ThreadAISkillDescriptionPlaceholder')}
          onChange={(event) => setDescription(event.currentTarget.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>{lang('ThreadAISkillInstructions')}</span>
        <textarea
          className={styles.fieldTextArea}
          value={instructions}
          maxLength={MAX_SKILL_INSTRUCTIONS_LENGTH}
          rows={7}
          placeholder={lang('ThreadAISkillInstructionsPlaceholder')}
          onChange={(event) => setInstructions(event.currentTarget.value)}
        />
        <small className={styles.fieldHint}>{lang('ThreadAISkillInstructionsHint')}</small>
      </label>
      <div className={styles.formActions}>
        <Button color="secondary" noForcedUpperCase onClick={() => setModalView('library')}>
          {lang('Cancel')}
        </Button>
        <Button type="submit" disabled={!title.trim() || !instructions.trim()} noForcedUpperCase>
          {lang(skills.length < MAX_ACTIVE_SKILLS ? 'ThreadAICreateAndAttachSkill' : 'ThreadAICreateSkill')}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <DropdownMenu
        className={styles.dropdown}
        bubbleClassName={styles.menuBubble}
        trigger={renderTrigger}
        positionY="bottom"
        positionX="left"
      >
        {skills.map((skill) => (
          <MenuItem
            key={skill.id}
            icon="check"
            className={styles.menuSkill}
            onClick={() => toggleSkill(skill)}
          >
            <span className={styles.menuSkillTitle}>{skill.title}</span>
          </MenuItem>
        ))}
        {Boolean(skills.length) && <MenuSeparator />}
        <MenuItem icon="list" onClick={openLibrary}>{lang('ThreadAIBrowseSkills')}</MenuItem>
        <MenuItem icon="add" onClick={openCreate}>{lang('ThreadAICreateSkill')}</MenuItem>
      </DropdownMenu>
      <Modal
        isOpen={isModalOpen}
        title={lang('ThreadAISkills')}
        dialogClassName={styles.dialog}
        contentClassName={styles.content}
        hasCloseButton
        onClose={closeModal}
      >
        {modalView === 'library' ? renderLibrary() : renderCreate()}
      </Modal>
    </>
  );
};

export default memo(ThreadAssistantSkills);
