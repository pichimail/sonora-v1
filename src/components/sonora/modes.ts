export type SonoraMode = {
  key: string;
  label: string;
  group: 'Create' | 'Voice' | 'Audio tools';
  description: string;
  needsAudio?: boolean;
  needsImage?: boolean;
  needsLyrics?: boolean;
};

export const SONORA_MODES: SonoraMode[] = [
  { key: 'create', label: 'Create Anything', group: 'Create', description: 'Generate original music from a prompt or lyrics.' },
  { key: 'remix', label: 'Remix', group: 'Create', description: 'Transform an attached track.', needsAudio: true },
  { key: 'extend', label: 'Extend', group: 'Create', description: 'Continue a song after a timestamp.', needsAudio: true },
  { key: 'replace', label: 'Replace', group: 'Create', description: 'Replace a region of an attached song.', needsAudio: true },
  { key: 'add-vocals', label: 'Add Vocals', group: 'Create', description: 'Sing lyrics over an instrumental.', needsAudio: true, needsLyrics: true },
  { key: 'add-instrumental', label: 'Add Instrumental', group: 'Create', description: 'Build accompaniment around a vocal.', needsAudio: true, needsLyrics: true },
  { key: 'image-song', label: 'Image to Song', group: 'Create', description: 'Turn an image into musical direction.', needsImage: true },
  { key: 'cover', label: 'Cover Song', group: 'Create', description: 'Perform a song with a selected AI voice.', needsAudio: true },
  { key: 'tts', label: 'Text to Speech', group: 'Voice', description: 'Generate voice from text.' },
  { key: 'voice-changer', label: 'Voice Changer', group: 'Voice', description: 'Convert the voice in an attached recording.', needsAudio: true },
  { key: 'sound', label: 'Sound Generator', group: 'Voice', description: 'Generate sound effects from a description.' },
  { key: 'lyrics', label: 'Lyrics Generator', group: 'Voice', description: 'Generate lyrics from a theme.' },
  { key: 'stems', label: 'Stem Splitter', group: 'Audio tools', description: 'Split vocals and instruments into stems.', needsAudio: true },
  { key: 'vocal-remover', label: 'Vocal Remover', group: 'Audio tools', description: 'Create vocals + instrumental stems.', needsAudio: true },
  { key: 'denoise', label: 'Voice Cleaner', group: 'Audio tools', description: 'Remove background noise.', needsAudio: true },
  { key: 'deecho', label: 'DeEcho', group: 'Audio tools', description: 'Remove unwanted echo.', needsAudio: true },
  { key: 'dereverb', label: 'DeReverb', group: 'Audio tools', description: 'Reduce room reverb.', needsAudio: true },
  { key: 'mastering', label: 'Mastering', group: 'Audio tools', description: 'Master a track against a reference.', needsAudio: true },
  { key: 'cutter', label: 'Audio Cutter', group: 'Audio tools', description: 'Trim an attached track precisely.', needsAudio: true },
  { key: 'speed', label: 'Speed Changer', group: 'Audio tools', description: 'Change playback speed.', needsAudio: true },
  { key: 'converter', label: 'Converter', group: 'Audio tools', description: 'Convert format, sample rate and bit depth.', needsAudio: true },
  { key: 'key-bpm', label: 'Key & BPM', group: 'Audio tools', description: 'Detect key and tempo.', needsAudio: true },
  { key: 'midi', label: 'Audio → MIDI', group: 'Audio tools', description: 'Extract MIDI from audio.', needsAudio: true },
  { key: 'transcribe', label: 'Transcribe', group: 'Audio tools', description: 'Transcribe and translate audio.', needsAudio: true },
  { key: 'cover-art', label: 'Cover Art', group: 'Audio tools', description: 'Generate album artwork.' },
];

export const MODE_GROUPS = ['Create', 'Voice', 'Audio tools'] as const;
