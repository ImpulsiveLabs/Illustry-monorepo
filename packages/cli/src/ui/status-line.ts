import type { CliStatus } from '../services/status';
import {
  color,
  formatModeBadge,
  paint
} from './output';

const sessionLabel = (status: CliStatus) => {
  if (status.mode !== 'live') {
    return 'local workspace';
  }
  if (status.authenticated) {
    return status.user?.email || 'signed in';
  }
  return 'not signed in';
};

const promptModeLabel = (status: CliStatus) => {
  if (status.mode === 'live') {
    return status.authenticated
      ? paint(color.green, `live:${status.user?.email || 'signed-in'}`)
      : paint(color.yellow, 'live:guest');
  }
  return paint(color.yellow, 'offline');
};

const formatStatusHeader = (status: CliStatus) => [
  `${paint(color.bold, 'Illustry CLI')} ${formatModeBadge(status.mode)} ${paint(color.gray, status.workspace)}`,
  `Server: ${status.server || '(none)'}    Session: ${sessionLabel(status)}`,
  `Local assets: ${status.assets}`
].join('\n');

export {
  formatStatusHeader,
  promptModeLabel,
  sessionLabel
};
