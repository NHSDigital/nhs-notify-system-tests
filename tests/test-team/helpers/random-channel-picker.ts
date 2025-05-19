type Channel = {
  name: string;
  path: string;
};

const channels: Channel[] = [
  { name: 'Email', path: 'email' },
  { name: 'Text message (SMS)', path: 'text-message' },
  { name: 'NHS App message', path: 'nhs-app' }
];

export function getRandomChannel(): Channel {
  const index = Math.floor(Math.random() * channels.length);
  return channels[index];
}
