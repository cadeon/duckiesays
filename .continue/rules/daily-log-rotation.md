---
globs: '["config/config.js","src/utils/conversationLogger.js"]'
description: All application logs should be rotated daily with date-stamped
  filenames to prevent large log files and make log management easier. This
  includes both error logs and conversation logs.
---

Configure Winston logging with daily rotation for all log files including guru-meditations.log