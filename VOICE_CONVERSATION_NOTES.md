# Voice conversation worker

The worker now handles `conversation-voice` jobs. It writes the uploaded audio buffer to a temporary file, transcribes it with `openai.audio.transcriptions.create`, and then calls the existing conversation coach generation.

Response keeps the same chat schema and adds optional `userTranscript`, so the app can display what the learner said inside the conversation.
