# Worker localization update

The worker now uses `uiLanguage` to localize user-facing AI feedback while keeping English-learning content in English.

## Behavior

For speaking review:

- `summary`, `praise`, `improvements.reason`, `errors.explanation`, `pronunciationWords.tip`, and `nextStep` are returned in the user's UI language.
- `correctedText`, `improvements.original`, `improvements.better`, `errors.original`, `errors.suggestion`, `pronunciationWords.word`, and `advancedAnswer` remain in English.

For AI conversation:

- `reply` and `suggestedReplies` remain in English so the learner can practice speaking.
- `quickFeedback` and `pronunciation.tip` are returned in the user's UI language.

## Supported `uiLanguage` values

- `en`
- `vi`
- `ja`
- `ko`
- `zh-Hans`
- `de`
- `fr`
- `es`
- `pt-BR`
- `it`
- `tr`
- `ar`

Fallback messages are localized for all supported UI languages.

## Compatibility

The response schema has not changed. JSON keys remain English for iOS compatibility.
