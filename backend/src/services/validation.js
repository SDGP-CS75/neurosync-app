const TASK_STATUSES = new Set(['todo', 'in-progress', 'done']);
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g;
const PROMPT_DELIMITERS = /["\\]/g;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanPromptText(value, maxLength) {
  return value
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(PROMPT_DELIMITERS, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function validateTimeZone(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    return 'timeZone must be a non-empty IANA timezone string';
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return null;
  } catch {
    return 'timeZone must be a valid IANA timezone';
  }
}

export function validateBreakdownBody(body) {
  if (!isRecord(body)) return { error: 'Request body must be a JSON object' };
  const { task } = body;
  if (typeof task !== 'string') return { error: 'Missing or invalid task' };
  const cleanTask = task.trim();
  if (cleanTask.length < 3) {
    return { error: 'Task must contain at least 3 characters' };
  }
  if (cleanTask.length > 500) {
    return { error: 'Task must be 500 characters or fewer' };
  }
  const timeZoneError = validateTimeZone(body.timeZone);
  if (timeZoneError) return { error: timeZoneError };
  return { value: { task: cleanTask } };
}

export function validateRescheduleBody(body) {
  if (!isRecord(body)) return { error: 'Request body must be a JSON object' };
  const { instruction, currentDueDate } = body;
  if (typeof instruction !== 'string' || instruction.trim().length === 0) {
    return { error: 'Missing or empty instruction' };
  }
  if (instruction.trim().length > 200) {
    return { error: 'Instruction must be 200 characters or fewer' };
  }
  if (
    typeof currentDueDate !== 'string' ||
    currentDueDate.trim().length === 0 ||
    currentDueDate.length > 50 ||
    Number.isNaN(Date.parse(currentDueDate))
  ) {
    return { error: 'currentDueDate must be a valid ISO date string' };
  }
  const timeZoneError = validateTimeZone(body.timeZone);
  if (timeZoneError) return { error: timeZoneError };
  return {
    value: {
      instruction: instruction.trim(),
      currentDueDate: currentDueDate.trim(),
    },
  };
}

export function validateSplitBody(body) {
  if (!isRecord(body)) return { error: 'Request body must be a JSON object' };
  const { task, steps, totalDurationMinutes } = body;
  if (typeof task !== 'string' || task.trim().length === 0) {
    return { error: 'Missing or empty task' };
  }
  if (task.trim().length > 500) {
    return { error: 'Task must be 500 characters or fewer' };
  }
  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 10) {
    return { error: 'steps must contain between 1 and 10 items' };
  }
  if (
    steps.some(
      (step) =>
        typeof step !== 'string' ||
        step.trim().length === 0 ||
        step.trim().length > 100
    )
  ) {
    return { error: 'Each step must be a string between 1 and 100 characters' };
  }
  if (
    typeof totalDurationMinutes !== 'number' ||
    !Number.isFinite(totalDurationMinutes) ||
    totalDurationMinutes <= 0 ||
    totalDurationMinutes > 10_000
  ) {
    return {
      error: 'totalDurationMinutes must be a number between 1 and 10000',
    };
  }
  const timeZoneError = validateTimeZone(body.timeZone);
  if (timeZoneError) return { error: timeZoneError };
  return {
    value: {
      task: cleanPromptText(task, 500),
      steps: steps.map((step) => cleanPromptText(step, 100)),
      totalDurationMinutes,
    },
  };
}

export function validateDailyPlanBody(body) {
  if (!isRecord(body)) return { error: 'Request body must be a JSON object' };
  const { tasks, availableMinutes } = body;
  if (!Array.isArray(tasks) || tasks.length === 0 || tasks.length > 20) {
    return { error: 'tasks must contain between 1 and 20 items' };
  }
  if (
    typeof availableMinutes !== 'number' ||
    !Number.isFinite(availableMinutes) ||
    availableMinutes <= 0 ||
    availableMinutes > 1_440
  ) {
    return { error: 'availableMinutes must be between 1 and 1440' };
  }

  const safeTasks = [];
  for (const task of tasks) {
    if (!isRecord(task)) return { error: 'Each task must be an object' };
    if (
      typeof task.id !== 'string' ||
      task.id.trim().length === 0 ||
      task.id.length > 200
    ) {
      return { error: 'Each task must have a valid id' };
    }
    if (
      typeof task.title !== 'string' ||
      task.title.trim().length === 0 ||
      task.title.length > 500
    ) {
      return { error: 'Each task must have a title of 500 characters or fewer' };
    }
    if (
      typeof task.category !== 'string' ||
      task.category.trim().length === 0 ||
      task.category.length > 50
    ) {
      return { error: 'Each task must have a category of 50 characters or fewer' };
    }
    if (!TASK_STATUSES.has(task.status)) {
      return { error: 'Each task must have a valid status' };
    }
    if (
      task.dueDate !== undefined &&
      task.dueDate !== null &&
      (typeof task.dueDate !== 'string' ||
        task.dueDate.length > 64 ||
        Number.isNaN(Date.parse(task.dueDate)))
    ) {
      return { error: 'Each task dueDate must be a valid ISO date string' };
    }
    if (
      task.sessionTime !== undefined &&
      task.sessionTime !== null &&
      (typeof task.sessionTime !== 'number' ||
        !Number.isFinite(task.sessionTime) ||
        task.sessionTime < 0 ||
        task.sessionTime > 1_000_000)
    ) {
      return { error: 'Each task sessionTime must be a non-negative number' };
    }
    if (
      task.subtasks !== undefined &&
      (!Array.isArray(task.subtasks) || task.subtasks.length > 100)
    ) {
      return { error: 'Each task may contain at most 100 subtasks' };
    }

    safeTasks.push({
      id: cleanPromptText(task.id, 200),
      title: cleanPromptText(task.title, 500),
      category: cleanPromptText(task.category, 50),
      status: task.status,
      dueDate: task.dueDate ?? null,
      sessionTime: task.sessionTime ?? 0,
    });
  }

  const timeZoneError = validateTimeZone(body.timeZone);
  if (timeZoneError) return { error: timeZoneError };
  return { value: { tasks: safeTasks, availableMinutes } };
}

export { cleanPromptText, isRecord };
