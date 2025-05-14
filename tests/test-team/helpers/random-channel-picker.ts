type Channel = {
  name: string;
  path: string;
};

const channels: Channel[] = [
  { name: 'Email', path: 'email' },
  { name: 'SMS', path: 'sms' },
  { name: 'NHSApp', path: 'nhsapp' }
];

export function getRandomChannel(): Channel {
  const index = Math.floor(Math.random() * channels.length);
  return channels[index];
}
